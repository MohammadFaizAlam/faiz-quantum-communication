"""Runs one complete BB84 experiment and assembles the API result.

Kept separate from the physics primitives in bb84.py so the protocol
stages are easy to narrate in order during a viva.
"""

from __future__ import annotations

import base64
import hashlib
from typing import Optional

from .bb84 import (
    THEORETICAL_THRESHOLD,
    DeterministicRng,
    Estimation,
    Photon,
    STATE_LABELS,
    apply_noise,
    binary_entropy,
    bob_measure,
    decide,
    encrypt_one_time_pad,
    estimate_qber,
    eve_intercept_resend,
    expected_combined_qber,
    expected_eve_qber,
    prepare_photons,
    secure_key_length,
    shor_preskill_key_rate,
    sift,
)


def _key_to_hex_bytes(key_bits: list[int]) -> str:
    """Pack the retained key bits into hex (MSB-first per byte)."""
    out = bytearray()
    for i in range(0, len(key_bits), 8):
        byte = 0
        chunk = key_bits[i : i + 8]
        for j, b in enumerate(chunk):
            byte = (byte << 1) | b
        # If the final chunk is short it is zero-padded on the right; we
        # only ever consume whole bytes via key_used_bits, so no ambiguity.
        if len(chunk) < 8:
            byte = byte << (8 - len(chunk))
        out.append(byte)
    return out.hex()


def run_experiment(
    n_photons: int,
    eve_enabled: bool,
    interception_rate: float,
    noise_rate: float,
    sample_fraction: float,
    threshold: float,
    message: Optional[str],
    seed: Optional[int],
) -> dict:
    """Execute the full BB84 pipeline and return a serializable result dict.

    Order of stages (see README for the physics):
      1. Alice prepares bits/states/bases
      2. Channel noise
      3. Eve intercept-resend (if enabled)
      4. Bob measures
      5. Sifting
      6-8. Parameter estimation + QBER
      9. Security decision
      10. Encryption (only when permitted)
    """
    rng = DeterministicRng(seed)
    logs: list[dict] = []

    def log(stage: str, message: str, level: str = "info") -> None:
        logs.append({"stage": stage, "message": message, "level": level})

    log("setup", f"Simulation configured for {n_photons} photons"
        + (f" with deterministic seed {seed}." if seed is not None else
           " using a cryptographically secure randomness source (not quantum "
           "randomness -- this is a software simulation)."))

    # -- Stage 1: preparation -------------------------------------------------
    photons: list[Photon] = prepare_photons(n_photons, rng)
    log("preparation",
        f"Alice generated {n_photons} random bits and independently chose "
        f"random bases: {sum(1 for p in photons if p.alice_basis == '+')} in "
        f"rectilinear (+) and {sum(1 for p in photons if p.alice_basis == 'x')} "
        f"in diagonal (x).")

    # -- Stage 2: channel noise ----------------------------------------------
    if noise_rate > 0:
        apply_noise(photons, noise_rate, rng)
        log("channel",
            f"Channel noise ({noise_rate:.1%} bit-flip model) applied to the "
            f"travelling states.", "warn")
    else:
        log("channel", "Channel noise disabled; the channel is ideal.")

    # -- Stage 3: Eve ----------------------------------------------------------
    if eve_enabled and interception_rate > 0:
        eve_intercept_resend(photons, interception_rate, rng)
        intercepted = sum(1 for p in photons if p.eve_intercepted)
        log("eve",
            f"Intercept-resend active: Eve measured and resent {intercepted}/{n_photons} "
            f"photons ({interception_rate:.0%} interception rate). By the No-Cloning "
            f"Theorem she cannot copy unknown states, so measurement is her only "
            f"option -- and measurement disturbs conjugate-basis states.",
            "warn")
    else:
        log("eve", "Eavesdropper disabled for this run.")

    # -- Stage 4: Bob measures -------------------------------------------------
    bob_measure(photons, rng)
    log("measurement", "Bob measured every photon in independently chosen random bases.")

    # -- Stage 5: sifting ------------------------------------------------------
    sifted = sift(photons)
    sifting_efficiency = len(sifted) / n_photons if n_photons > 0 else 0.0
    log("sifting",
        f"Bases matched on {len(sifted)}/{n_photons} positions "
        f"({sifting_efficiency:.1%}, theoretical expectation 50.0%); the rest were "
        f"publicly discarded. Only basis choices were announced, never bit values.")

    # -- Stages 6-8: parameter estimation --------------------------------------
    est: Estimation
    est, retained = estimate_qber(sifted, sample_fraction, rng)
    if est.tested > 0:
        ci_note = ""
        if est.qber_ci_low is not None and est.qber_ci_high is not None:
            ci_note = (f" 95% confidence interval: "
                       f"[{est.qber_ci_low:.2%}, {est.qber_ci_high:.2%}].")
        log("estimation",
            f"Parameter estimation: {est.tested} sifted bits were randomly "
            f"revealed and compared; {est.errors} disagreed. "
            f"QBER = {est.errors}/{est.tested} = {est.qber:.1%}.{ci_note} "
            f"These positions are removed from the candidate key.")
    else:
        log("estimation",
            "No sifted bits were available for parameter estimation.",
            "warn")

    # -- Stage 9: decision ------------------------------------------------------
    retained_bits = [sp.bob_bit for sp in retained]
    status, rationale = decide(est.qber, threshold, len(retained_bits))
    log("decision", rationale,
        "success" if status == "PASS" else ("error" if status == "ABORT" else "warn"))

    # -- Stage 10: encryption (gated) -------------------------------------------
    encryption: Optional[dict] = None
    message_len = len(message.encode("utf-8")) if message else 0
    key_needed_bits = message_len * 8
    if status == "PASS":
        if message and message_len > 0:
            if len(retained_bits) >= key_needed_bits:
                key_hex = _key_to_hex_bytes(retained_bits)
                key_bytes = bytes.fromhex(key_hex)
                enc = encrypt_one_time_pad(message, key_bytes)
                encryption = {
                    "permitted": True,
                    "method": "one_time_pad_xor",
                    "message_length_bytes": message_len,
                    "key_used_bits": enc["key_used_bits"],
                    "remaining_key_bits": len(retained_bits) - enc["key_used_bits"],
                    "cipher_hex": enc["cipher_hex"],
                    "decrypted_message": enc["decrypted"],
                }
                log("encryption",
                    f"One-time-pad encryption of a {message_len}-byte message "
                    f"succeeded using {enc['key_used_bits']} key bits "
                    f"({len(retained_bits) - enc['key_used_bits']} remain). "
                    f"The OTP key must never be reused.", "success")
            else:
                encryption = {
                    "permitted": False,
                    "method": "one_time_pad_xor",
                    "reason": (f"The retained key has {len(retained_bits)} bits but the "
                               f"{message_len}-byte message needs {key_needed_bits}. "
                               f"Increase the photon count or shorten the message."),
                }
                log("encryption",
                    f"Encryption skipped: insufficient key material "
                    f"({len(retained_bits)} bits available, {key_needed_bits} needed).",
                    "warn")
        elif message is not None and message_len == 0:
            encryption = {
                "permitted": False,
                "method": None,
                "reason": "The message is empty; nothing to encrypt.",
            }
            log("encryption", "Encryption skipped: empty message.", "warn")
        else:
            log("encryption",
                f"No plaintext supplied; the {len(retained_bits)}-bit retained key "
                f"is available for a future encryption stage.")
    else:
        reason = ("The run was aborted because the QBER exceeded the threshold."
                  if status == "ABORT" else
                  "The run was inconclusive, so no key was accepted.")
        encryption = {
            "permitted": False,
            "method": None,
            "reason": reason,
        }
        log("encryption", f"Encryption NOT permitted. {reason} "
                          f"Ciphertext is never fabricated from a rejected key.", "error")

    # -- Assemble photon table ---------------------------------------------------
    photon_rows = []
    for p in photons:
        kept_position = p.bob_basis == p.alice_basis
        photon_rows.append({
            "index": p.index,
            "alice_bit": p.alice_bit,
            "alice_basis": p.alice_basis,
            "alice_state": STATE_LABELS[(p.alice_basis, p.alice_bit)],
            "noise_flipped": p.noise_flipped,
            "eve_intercepted": p.eve_intercepted,
            "eve_basis": p.eve_basis or None,
            "eve_result": p.eve_result if p.eve_result >= 0 else None,
            "arriving_state": STATE_LABELS[(p.arriving_basis, p.arriving_bit)],
            "bob_basis": p.bob_basis,
            "bob_result": p.bob_result,
            "basis_match": kept_position,
            "sifted": kept_position,
            "tested": False,
            "retained": False,
        })

    # Mark test/retained status on photon rows (indices refer to photon index).
    # sample_positions index into the sifted list; map to photon indices.
    tested_photon_idx = {sifted[i].index for i in est.sample_positions}
    for row in photon_rows:
        row["tested"] = row["index"] in tested_photon_idx
        row["retained"] = row["sifted"] and not row["tested"]

    retained_details = [
        {
            "index": sp.index,
            "alice_bit": sp.alice_bit,
            "bob_bit": sp.bob_bit,
        }
        for sp in retained
    ]

    run_id = hashlib.sha256(
        f"{n_photons}|{eve_enabled}|{interception_rate}|{noise_rate}|"
        f"{sample_fraction}|{threshold}|{message}|{seed}|{logs[0]['message']}".encode()
    ).hexdigest()[:12]

    # Warnings surfaced to the UI.
    warnings: list[str] = [
        "This is a software simulation of idealized polarization states, not "
        "real quantum hardware.",
    ]
    if seed is not None:
        warnings.append("A deterministic seed was used: this run is reproducible "
                        "but the randomness is NOT cryptographically secure.")
    if status == "PASS":
        warnings.append("A PASS result means the observed QBER was below the "
                        "educational threshold; it does NOT prove the absence "
                        "of an eavesdropper.")

    # -- Compute theoretical / information-theoretic metrics --------------------
    theo_eve_qber = expected_eve_qber(interception_rate) if eve_enabled else 0.0
    theo_combined = expected_combined_qber(noise_rate, interception_rate, eve_enabled)

    # Key rate and secure key length (Shor-Preskill)
    observed_qber_for_rate = est.qber if est.qber is not None else 0.0
    key_rate = shor_preskill_key_rate(observed_qber_for_rate)
    secure_len = secure_key_length(len(retained_bits), observed_qber_for_rate)

    return {
        "run_id": run_id,
        "config": {
            "n_photons": n_photons,
            "eve_enabled": eve_enabled,
            "interception_rate": interception_rate,
            "noise_rate": noise_rate,
            "sample_fraction": sample_fraction,
            "threshold": threshold,
            "message": message,
            "seed": seed,
        },
        "randomness": {
            "source": ("seeded Python random.Random (deterministic, for "
                       "reproducible experiments only)" if seed is not None
                       else "Python secrets CSPRNG (classical software "
                            "randomness, not physical quantum randomness)"),
            "seeded": seed is not None,
        },
        "photons": photon_rows,
        "sifted_count": len(sifted),
        "sifting_efficiency": sifting_efficiency,
        "estimation": {
            "sample_size": est.tested,
            "errors": est.errors,
            "qber": est.qber,
            "qber_std": est.qber_std,
            "qber_ci_low": est.qber_ci_low,
            "qber_ci_high": est.qber_ci_high,
            "sample_details": est.sample_details,
        },
        "decision": {
            "status": status,
            "rationale": rationale,
            "qber_observed": est.qber,
            "threshold_configured": threshold,
            "theoretical_reference": THEORETICAL_THRESHOLD,
            "theoretical_reference_note": (
                "~11% is the maximum QBER tolerable under idealized asymptotic "
                "security proofs (Shor-Preskill). It is not a universal "
                "detector threshold; the abort threshold above is a "
                "configurable educational policy."),
            "expected_full_intercept_qber": theo_eve_qber,
            "expected_combined_qber": theo_combined,
        },
        "retained_key": {
            "length_bits": len(retained_bits),
            "details": retained_details,
        },
        "information_theory": {
            "binary_entropy_of_qber": (
                binary_entropy(est.qber) if est.qber is not None else None),
            "shor_preskill_key_rate": key_rate,
            "shor_preskill_key_rate_note": (
                "Fraction of sifted key surviving error correction and privacy "
                "amplification: r = 1 - 2·H(QBER). Goes to zero at QBER ≈ 11%."),
            "secure_key_length_bits": secure_len,
            "secure_key_length_note": (
                "Estimated key bits remaining after privacy amplification: "
                "L = n_retained × max(0, 1 - 2·H(QBER))."),
        },
        "encryption": encryption,
        "logs": logs,
        "warnings": warnings,
    }
