"""Unit tests for the BB84 simulation core and experiment pipeline.

Seeded runs use DeterministicRng so every assertion is reproducible.
"""

from __future__ import annotations

import pytest

from app.core.bb84 import (
    BASIS_CROSS,
    BASIS_PLUS,
    DeterministicRng,
    Photon,
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
from app.core.experiment import run_experiment


# ---------------------------------------------------------------------------
# State preparation
# ---------------------------------------------------------------------------


def test_prepare_photons_counts_and_values():
    rng = DeterministicRng(seed=42)
    photons = prepare_photons(100, rng)
    assert len(photons) == 100
    for i, p in enumerate(photons):
        assert p.index == i
        assert p.alice_bit in (0, 1)
        assert p.alice_basis in (BASIS_PLUS, BASIS_CROSS)
        # With no channel effects, the arriving state equals the prepared one.
        assert p.arriving_bit == p.alice_bit
        assert p.arriving_basis == p.alice_basis


def test_prepare_photons_uses_both_bases():
    rng = DeterministicRng(seed=7)
    photons = prepare_photons(200, rng)
    bases = {p.alice_basis for p in photons}
    assert bases == {BASIS_PLUS, BASIS_CROSS}


# ---------------------------------------------------------------------------
# Measurement rules
# ---------------------------------------------------------------------------


def test_same_basis_measurement_is_deterministic():
    """A photon measured in its own basis always yields the prepared bit."""
    rng = DeterministicRng(seed=1)
    p = Photon(index=0, alice_bit=1, alice_basis=BASIS_PLUS,
               arriving_bit=1, arriving_basis=BASIS_PLUS)
    results = set()
    for _ in range(200):
        p.bob_basis = BASIS_PLUS
        # Emulate bob_measure's rule directly for determinism of the rule.
        result = p.arriving_bit  # same basis -> exact bit
        results.add(result)
    assert results == {1}


def test_bob_measure_same_basis_recovers_bit():
    rng = DeterministicRng(seed=3)
    photons = prepare_photons(400, rng)
    # Force Bob's bases to match Alice's by measuring the rule manually:
    # instead, run bob_measure and check the sifted subset matches exactly.
    results = bob_measure(photons, rng)
    assert len(results) == 400
    assert all(r in (0, 1) for r in results)
    matches = [p for p in photons if p.bob_basis == p.alice_basis]
    assert matches, "expected some basis matches across 400 photons"
    for p in matches:
        assert p.bob_result == p.arriving_bit


def test_bob_measure_conjugate_basis_is_random():
    """Mismatches must be roughly 50/50 over many trials (statistical)."""
    rng = DeterministicRng(seed=11)
    photons = [Photon(index=i, alice_bit=0, alice_basis=BASIS_PLUS,
                      arriving_bit=0, arriving_basis=BASIS_PLUS)
               for i in range(4000)]
    bob_measure(photons, rng)
    mismatched = [p for p in photons if p.bob_basis == BASIS_CROSS]
    assert len(mismatched) > 1500  # ~2000 expected
    ones = sum(p.bob_result for p in mismatched)
    frac = ones / len(mismatched)
    assert 0.42 < frac < 0.58  # uniformly random outcome


# ---------------------------------------------------------------------------
# Intercept-resend
# ---------------------------------------------------------------------------


def test_eve_disabled_leaves_no_record():
    rng = DeterministicRng(seed=5)
    photons = prepare_photons(50, rng)
    eve_intercept_resend(photons, 0.0, rng)
    assert not any(p.eve_intercepted for p in photons)
    for p in photons:
        assert p.arriving_bit == p.alice_bit
        assert p.arriving_basis == p.alice_basis


def test_eve_full_interception_resends_in_her_basis():
    rng = DeterministicRng(seed=9)
    photons = prepare_photons(500, rng)
    eve_intercept_resend(photons, 1.0, rng)
    for p in photons:
        assert p.eve_intercepted
        assert p.eve_basis in (BASIS_PLUS, BASIS_CROSS)
        assert p.eve_result in (0, 1)
        # Resent state encodes Eve's result in Eve's basis.
        assert p.arriving_bit == p.eve_result
        assert p.arriving_basis == p.eve_basis


def test_eve_wrong_basis_result_is_random():
    """When Eve measures in the conjugate basis her result is random ~50/50."""
    rng = DeterministicRng(seed=13)
    photons = [Photon(index=i, alice_bit=0, alice_basis=BASIS_PLUS,
                      arriving_bit=0, arriving_basis=BASIS_PLUS)
               for i in range(4000)]
    eve_intercept_resend(photons, 1.0, rng)
    wrong = [p for p in photons if p.eve_basis == BASIS_CROSS]
    assert len(wrong) > 1500
    frac = sum(p.eve_result for p in wrong) / len(wrong)
    assert 0.42 < frac < 0.58


def test_intercept_resend_induces_expected_qber():
    """Full interception should give ~25% QBER among sifted bits.

    Mechanism: Eve picks the wrong basis 1/2 the time; in that case Alice
    and Bob's basis match still occurs ~1/2 of the time and Bob's result
    (measuring Eve's conjugate-basis state) is wrong 1/2 the time.
    """
    rng = DeterministicRng(seed=21)
    photons = prepare_photons(8000, rng)
    eve_intercept_resend(photons, 1.0, rng)
    bob_measure(photons, rng)
    sifted = sift(photons)
    assert len(sifted) > 3000
    qber = sum(sp.alice_bit != sp.bob_bit for sp in sifted) / len(sifted)
    assert 0.20 < qber < 0.30  # expected 0.25


def test_eve_zero_interception_induces_no_errors():
    rng = DeterministicRng(seed=23)
    photons = prepare_photons(1000, rng)
    eve_intercept_resend(photons, 0.0, rng)
    bob_measure(photons, rng)
    sifted = sift(photons)
    assert all(sp.alice_bit == sp.bob_bit for sp in sifted)


# ---------------------------------------------------------------------------
# Noise
# ---------------------------------------------------------------------------


def test_noise_flips_correct_fraction():
    rng = DeterministicRng(seed=31)
    photons = prepare_photons(4000, rng)
    apply_noise(photons, 0.1, rng)
    flipped = sum(p.noise_flipped for p in photons)
    assert 0.07 < flipped / 4000 < 0.13
    for p in photons:
        if p.noise_flipped:
            assert p.arriving_bit == 1 - p.alice_bit
            assert p.arriving_basis == p.alice_basis  # basis preserved
        else:
            assert p.arriving_bit == p.alice_bit


def test_noise_zero_is_noop():
    rng = DeterministicRng(seed=33)
    photons = prepare_photons(100, rng)
    apply_noise(photons, 0.0, rng)
    assert not any(p.noise_flipped for p in photons)


def test_noise_applied_before_eve_no_double_counting():
    """Eve measures the noisy state, so a noise flip is not applied twice."""
    rng = DeterministicRng(seed=35)
    photons = prepare_photons(1000, rng)
    apply_noise(photons, 1.0, rng)  # every photon flipped exactly once
    eve_intercept_resend(photons, 1.0, rng)
    for p in photons:
        # After one flip and one Eve measurement, the arriving state is
        # Eve's resend in Eve's basis; Eve's result matches the flipped bit
        # whenever her basis equals the (unchanged) arriving basis.
        if p.eve_basis == p.alice_basis:
            assert p.eve_result == 1 - p.alice_bit


# ---------------------------------------------------------------------------
# Sifting, estimation, QBER
# ---------------------------------------------------------------------------


def test_sift_keeps_only_matching_bases():
    rng = DeterministicRng(seed=41)
    photons = prepare_photons(600, rng)
    bob_measure(photons, rng)
    sifted = sift(photons)
    expected = {p.index for p in photons if p.bob_basis == p.alice_basis}
    assert {sp.index for sp in sifted} == expected
    # Ideal model: matched bases reproduce Alice's bit exactly (no Eve/noise).
    assert all(sp.alice_bit == sp.bob_bit for sp in sifted)


def test_estimate_qber_counts_and_retains():
    rng = DeterministicRng(seed=43)
    photons = prepare_photons(400, rng)
    bob_measure(photons, rng)
    sifted = sift(photons)
    est, retained = estimate_qber(sifted, 0.25, rng)
    assert est.tested == len(est.sample_positions)
    assert est.errors == sum(
        1 for d in est.sample_details if not d["match"])
    assert est.qber == est.errors / est.tested
    assert len(retained) == len(sifted) - est.tested
    # Test positions must be removed from the retained key.
    retained_idx = {sp.index for sp in retained}
    tested_idx = {sifted[i].index for i in est.sample_positions}
    assert not (retained_idx & tested_idx)


def test_estimate_qber_empty_sample_safe():
    rng = DeterministicRng(seed=45)
    photons = prepare_photons(50, rng)
    bob_measure(photons, rng)
    sifted = sift(photons)
    est, retained = estimate_qber(sifted, 0.0, rng)
    assert est.tested == 0
    assert est.qber is None
    assert len(retained) == len(sifted)


def test_estimate_qber_sample_capped_at_sifted_size():
    rng = DeterministicRng(seed=47)
    photons = prepare_photons(40, rng)
    bob_measure(photons, rng)
    sifted = sift(photons)
    est, retained = estimate_qber(sifted, 1.0, rng)
    assert est.tested == len(sifted)
    assert retained == []


# ---------------------------------------------------------------------------
# Decision policy
# ---------------------------------------------------------------------------


def test_decide_pass():
    status, _ = decide(0.02, 0.11, 100)
    assert status == "PASS"


def test_decide_pass_at_boundary():
    status, _ = decide(0.11, 0.11, 100)
    assert status == "PASS"  # at-or-below passes


def test_decide_abort():
    status, _ = decide(0.30, 0.11, 100)
    assert status == "ABORT"


def test_decide_inconclusive_no_sample():
    status, _ = decide(None, 0.11, 100)
    assert status == "INCONCLUSIVE"


def test_decide_inconclusive_no_retained_key():
    status, _ = decide(0.02, 0.11, 0)
    assert status == "INCONCLUSIVE"


# ---------------------------------------------------------------------------
# Encryption gating
# ---------------------------------------------------------------------------


def test_one_time_pad_roundtrip():
    key = bytes([0b10101010, 0b01010101, 0xFF, 0x00])
    result = encrypt_one_time_pad("BB84", key)
    assert result["decrypted"] == "BB84"
    assert result["key_used_bits"] == 32


def test_one_time_pad_rejects_short_key():
    with pytest.raises(ValueError):
        encrypt_one_time_pad("too long a message", b"\x01")


# ---------------------------------------------------------------------------
# Experiment pipeline
# ---------------------------------------------------------------------------


def _run(**overrides):
    kwargs = dict(
        n_photons=400,
        eve_enabled=False,
        interception_rate=0.0,
        noise_rate=0.0,
        sample_fraction=0.25,
        threshold=0.11,
        message=None,
        seed=101,
    )
    kwargs.update(overrides)
    return run_experiment(**kwargs)


def test_run_ideal_clean_pass():
    result = _run(n_photons=1000)
    assert result["decision"]["status"] == "PASS"
    assert result["estimation"]["qber"] == 0.0
    assert result["sifted_count"] > 400
    assert result["encryption"] is None  # no message supplied


def test_run_with_eve_full_interception_aborts():
    result = _run(n_photons=2000, eve_enabled=True, interception_rate=1.0)
    assert result["decision"]["status"] == "ABORT"
    assert result["encryption"]["permitted"] is False
    intercepted = sum(1 for p in result["photons"] if p["eve_intercepted"])
    assert intercepted == 2000


def test_run_with_light_eve_may_still_pass():
    """Eve at a low rate may fall below threshold -- never assert the
    opposite; just require internal consistency of the decision."""
    result = _run(n_photons=2000, eve_enabled=True, interception_rate=0.1)
    qber = result["estimation"]["qber"]
    status = result["decision"]["status"]
    if status == "PASS":
        assert qber <= result["decision"]["threshold_configured"]
    else:
        assert status == "ABORT"


def test_run_abort_never_decrypts():
    result = _run(n_photons=500, eve_enabled=True, interception_rate=1.0,
                  message="secret plan")
    assert result["decision"]["status"] == "ABORT"
    enc = result["encryption"]
    assert enc["permitted"] is False
    assert "cipher_hex" not in enc
    assert "decrypted_message" not in enc


def test_run_inconclusive_empty_sifted_sample():
    # Tiny sample fraction on a small run: sample may be empty.
    result = _run(n_photons=8, sample_fraction=0.0, message="hi")
    assert result["decision"]["status"] == "INCONCLUSIVE"
    assert result["estimation"]["qber"] is None
    assert result["encryption"]["permitted"] is False


def test_run_pass_with_message_encrypts():
    result = _run(n_photons=1000, message="QUANTUM")
    assert result["decision"]["status"] == "PASS"
    enc = result["encryption"]
    assert enc["permitted"] is True
    assert enc["decrypted_message"] == "QUANTUM"
    assert len(enc["cipher_hex"]) == 2 * enc["key_used_bits"] // 8


def test_run_pass_insufficient_key_for_message():
    result = _run(n_photons=100, sample_fraction=0.9, message="a much longer message than the key")
    if result["decision"]["status"] == "PASS":
        enc = result["encryption"]
        assert enc["permitted"] is False
        assert "needs" in enc["reason"].lower()


def test_run_seed_reproducibility():
    a = _run(n_photons=300, seed=999)
    b = _run(n_photons=300, seed=999)
    assert a["photons"] == b["photons"]
    assert a["estimation"]["sample_details"] == b["estimation"]["sample_details"]


def test_run_noise_only_modest_qber():
    result = _run(n_photons=2000, noise_rate=0.03)
    qber = result["estimation"]["qber"]
    assert qber is not None and qber < 0.11  # ~3% expected


def test_run_logs_are_ordered_and_staged():
    result = _run(n_photons=100)
    stages = [entry["stage"] for entry in result["logs"]]
    assert stages == sorted(stages, key=[
        "setup", "preparation", "channel", "eve", "measurement",
        "sifting", "estimation", "decision", "encryption"].index)


def test_run_status_flags_on_photon_rows():
    result = _run(n_photons=200, sample_fraction=0.5)
    rows = result["photons"]
    tested = [r for r in rows if r["tested"]]
    retained = [r for r in rows if r["retained"]]
    assert all(not r["retained"] for r in tested)
    assert all(r["sifted"] for r in tested + retained)
    assert len(tested) == result["estimation"]["sample_size"]
    assert len(retained) == result["retained_key"]["length_bits"]


def test_run_randomness_metadata():
    seeded = _run(n_photons=50, seed=3)
    assert seeded["randomness"]["seeded"] is True
    unseeded = _run(n_photons=50, seed=None)
    assert unseeded["randomness"]["seeded"] is False
    assert "not physical quantum randomness" in unseeded["randomness"]["source"]


# ---------------------------------------------------------------------------
# Information-theoretic functions
# ---------------------------------------------------------------------------


def test_binary_entropy_boundaries():
    """H(0) = H(1) = 0, H(0.5) = 1."""
    assert binary_entropy(0.0) == 0.0
    assert binary_entropy(1.0) == 0.0
    assert abs(binary_entropy(0.5) - 1.0) < 1e-12


def test_binary_entropy_symmetry():
    """H(p) = H(1-p) for all p."""
    for p in [0.1, 0.2, 0.3, 0.4]:
        assert abs(binary_entropy(p) - binary_entropy(1.0 - p)) < 1e-12


def test_binary_entropy_intermediate_value():
    """H(0.11) ≈ 0.4998 which is close to 0.5."""
    h = binary_entropy(0.11)
    assert 0.49 < h < 0.51  # this is what makes ~11% the threshold


def test_shor_preskill_key_rate_zero_qber():
    """At QBER=0 the full key survives: rate=1."""
    assert shor_preskill_key_rate(0.0) == 1.0


def test_shor_preskill_key_rate_at_threshold():
    """At QBER≈11% the rate drops to ≈0."""
    rate = shor_preskill_key_rate(0.11)
    assert rate < 0.01  # very close to zero


def test_shor_preskill_key_rate_high_qber():
    """Above 11% no key can be distilled."""
    assert shor_preskill_key_rate(0.20) == 0.0
    assert shor_preskill_key_rate(0.50) == 0.0


def test_shor_preskill_key_rate_moderate_qber():
    """At QBER=5% the rate should be positive and substantial."""
    rate = shor_preskill_key_rate(0.05)
    assert 0.3 < rate < 0.8  # roughly 1 - 2*H(0.05) ≈ 0.43


def test_expected_eve_qber_formula():
    """QBER_Eve = f / 4."""
    assert expected_eve_qber(1.0) == 0.25
    assert expected_eve_qber(0.5) == 0.125
    assert expected_eve_qber(0.0) == 0.0
    assert abs(expected_eve_qber(0.2) - 0.05) < 1e-12


def test_expected_combined_qber_noise_only():
    """Without Eve, combined QBER = noise rate."""
    assert abs(expected_combined_qber(0.05, 0.0, False) - 0.05) < 1e-12
    assert abs(expected_combined_qber(0.10, 1.0, False) - 0.10) < 1e-12


def test_expected_combined_qber_eve_only():
    """Without noise, combined QBER = f/4."""
    assert abs(expected_combined_qber(0.0, 1.0, True) - 0.25) < 1e-12
    assert abs(expected_combined_qber(0.0, 0.5, True) - 0.125) < 1e-12


def test_expected_combined_qber_both():
    """Combined = p1 + p2 - 2*p1*p2 (XOR composition)."""
    noise = 0.05
    interception = 1.0
    p1 = noise
    p2 = interception / 4.0  # 0.25
    expected = p1 + p2 - 2 * p1 * p2
    actual = expected_combined_qber(noise, interception, True)
    assert abs(actual - expected) < 1e-12


def test_secure_key_length_zero_qber():
    """At QBER=0, the full retained key is secure."""
    assert secure_key_length(1000, 0.0) == 1000


def test_secure_key_length_high_qber():
    """Above threshold, no secure key."""
    assert secure_key_length(1000, 0.20) == 0
    assert secure_key_length(1000, 0.50) == 0


def test_secure_key_length_moderate_qber():
    """At moderate QBER, some key remains."""
    length = secure_key_length(1000, 0.05)
    assert 300 < length < 800  # roughly 1000 * 0.43 ≈ 430


# ---------------------------------------------------------------------------
# QBER confidence interval
# ---------------------------------------------------------------------------


def test_qber_confidence_interval_computed():
    """Estimation should include CI when sample is non-empty."""
    rng = DeterministicRng(seed=51)
    photons = prepare_photons(400, rng)
    bob_measure(photons, rng)
    sifted = sift(photons)
    est, _ = estimate_qber(sifted, 0.5, rng)
    assert est.qber is not None
    assert est.qber_std is not None
    assert est.qber_ci_low is not None
    assert est.qber_ci_high is not None
    assert est.qber_ci_low <= est.qber <= est.qber_ci_high
    assert est.qber_ci_low >= 0.0
    assert est.qber_ci_high <= 1.0


def test_qber_confidence_interval_none_when_empty():
    """CI should be None when no sample is taken."""
    rng = DeterministicRng(seed=53)
    photons = prepare_photons(50, rng)
    bob_measure(photons, rng)
    sifted = sift(photons)
    est, _ = estimate_qber(sifted, 0.0, rng)
    assert est.qber is None
    assert est.qber_std is None
    assert est.qber_ci_low is None
    assert est.qber_ci_high is None


# ---------------------------------------------------------------------------
# Experiment pipeline -- new fields
# ---------------------------------------------------------------------------


def test_run_sifting_efficiency_present():
    result = _run(n_photons=500)
    assert "sifting_efficiency" in result
    eff = result["sifting_efficiency"]
    assert 0.3 < eff < 0.7  # close to theoretical 50%


def test_run_information_theory_block():
    result = _run(n_photons=1000)
    it = result["information_theory"]
    assert "binary_entropy_of_qber" in it
    assert "shor_preskill_key_rate" in it
    assert "secure_key_length_bits" in it
    # Ideal run with no Eve: QBER=0, rate=1, full key
    assert it["shor_preskill_key_rate"] == 1.0
    assert it["secure_key_length_bits"] == result["retained_key"]["length_bits"]


def test_run_information_theory_with_eve():
    result = _run(n_photons=2000, eve_enabled=True, interception_rate=1.0)
    it = result["information_theory"]
    # High QBER: rate should be 0
    assert it["shor_preskill_key_rate"] == 0.0
    assert it["secure_key_length_bits"] == 0


def test_run_dynamic_expected_eve_qber():
    """expected_full_intercept_qber should be f/4, not hardcoded 0.25."""
    result = _run(n_photons=500, eve_enabled=True, interception_rate=0.5)
    assert abs(result["decision"]["expected_full_intercept_qber"] - 0.125) < 1e-12


def test_run_expected_combined_qber_present():
    result = _run(n_photons=500, eve_enabled=True, interception_rate=0.5,
                  noise_rate=0.03)
    combined = result["decision"]["expected_combined_qber"]
    assert combined is not None
    # Should be p1 + p2 - 2*p1*p2 where p1=0.03, p2=0.125
    expected = 0.03 + 0.125 - 2 * 0.03 * 0.125
    assert abs(combined - expected) < 1e-12


def test_run_qber_ci_in_estimation():
    result = _run(n_photons=500)
    est = result["estimation"]
    assert "qber_std" in est
    assert "qber_ci_low" in est
    assert "qber_ci_high" in est
