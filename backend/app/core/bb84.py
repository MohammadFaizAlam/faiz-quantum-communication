"""BB84 protocol simulation core.

This module implements an educational, idealized simulation of the BB84
quantum key distribution protocol (Bennett & Brassard, 1984). It models
polarization qubits as classical random variables according to the
statistical rules of quantum measurement:

State preparation (Alice)
-------------------------
The rectilinear (+) basis encodes |0> -> bit 0 and |1> -> bit 1.
The diagonal (x) basis encodes |+> = (|0> + |1>)/sqrt(2) -> bit 0 and
|-> = (|0> - |1>)/sqrt(2) -> bit 1.

Measurement (Bob / Eve)
-----------------------
If a qubit is measured in the same basis it was prepared in, the prepared
bit is recovered with probability 1 (ideal model).
If it is measured in the conjugate basis, the outcome is uniformly random
(0 or 1 with equal probability). This is the defining feature of BB84:
the two bases are mutually unbiased, so <psi|phi>^2 = 1/2 for every pair
of states from different bases.

IMPORTANT SCOPING NOTE
----------------------
This is a software simulation of the *statistical rules* of idealized
polarization states, not a quantum-mechanical wavefunction simulation and
not real quantum hardware. Randomness comes from Python's `secrets` /
`random` modules, which are classical pseudo-/CSPRNG sources -- these are
NOT physical quantum randomness.
"""

from __future__ import annotations

import math
import secrets
from dataclasses import dataclass, field
from typing import Optional, Sequence

# Basis identifiers
BASIS_PLUS = "+"  # rectilinear: |0>, |1>
BASIS_CROSS = "x"  # diagonal: |+>, |->

# Human-readable state labels, used by the UI.
STATE_LABELS = {
    (BASIS_PLUS, 0): "|0>",
    (BASIS_PLUS, 1): "|1>",
    (BASIS_CROSS, 0): "|+> = (|0> + |1>)/sqrt(2)",
    (BASIS_CROSS, 1): "|-> = (|0> - |1>)/sqrt(2)",
}


def random_bit() -> int:
    """Cryptographically secure random bit in {0, 1}.

    Note: this is a classical CSPRNG, not a physical quantum random
    number generator. It is used because the simulation requires an
    unbiased, high-quality randomness source, and `secrets` provides that
    without any external dependency.
    """
    return secrets.randbelow(2)


def random_basis() -> str:
    """Randomly choose a measurement/preparation basis (+ or x)."""
    return BASIS_PLUS if secrets.randbelow(2) == 0 else BASIS_CROSS


class DeterministicRng:
    """Seeded random source for repeatable experiments and tests.

    Deliberately distinct from `random_bit`/`random_basis`: when a seed is
    supplied the run is fully reproducible but must not be considered
    cryptographically secure. When no seed is supplied we delegate to the
    `secrets`-based functions above.
    """

    def __init__(self, seed: Optional[int] = None):
        self._seeded = seed is not None
        if self._seeded:
            import random

            self._rng = random.Random(seed)

    @property
    def seeded(self) -> bool:
        return self._seeded

    def bit(self) -> int:
        if self._seeded:
            return self._rng.randint(0, 1)
        return random_bit()

    def basis(self) -> str:
        if self._seeded:
            return BASIS_PLUS if self._rng.randint(0, 1) == 0 else BASIS_CROSS
        return random_basis()

    def choice(self, seq: Sequence) -> object:
        if self._seeded:
            return self._rng.choice(list(seq))
        return secrets.choice(list(seq))

    def random(self) -> float:
        """Uniform float in [0, 1)."""
        if self._seeded:
            return self._rng.random()
        # secrets-based uniform float: 53 random bits / 2^53
        return secrets.randbits(53) / float(1 << 53)


# ---------------------------------------------------------------------------
# State preparation
# ---------------------------------------------------------------------------


@dataclass
class Photon:
    """One qubit travelling from Alice to Bob."""

    index: int
    alice_bit: int
    alice_basis: str
    # State as it arrives at Bob, after channel effects (Eve resend / noise).
    # `bit` is the bit carried by the arriving state and `basis` the basis it
    # is encoded in. With no Eve and no noise they equal Alice's values.
    arriving_bit: int = -1
    arriving_basis: str = ""
    # Eve's record, filled only when she intercepts this photon.
    eve_intercepted: bool = False
    eve_basis: str = ""
    eve_result: int = -1
    # Bob's record, filled by bob_measure().
    bob_basis: str = ""
    bob_result: int = -1
    # Set by apply_noise() when this photon's encoded bit was flipped.
    noise_flipped: bool = False

    def alice_state_label(self) -> str:
        return STATE_LABELS[(self.alice_basis, self.alice_bit)]

    def arriving_state_label(self) -> str:
        return STATE_LABELS[(self.arriving_basis, self.arriving_bit)]


def prepare_photons(n: int, rng: DeterministicRng) -> list[Photon]:
    """Stage 1 -- Alice generates n random bits and independent bases."""
    photons: list[Photon] = []
    for i in range(n):
        bit = rng.bit()
        basis = rng.basis()
        photons.append(
            Photon(index=i, alice_bit=bit, alice_basis=basis,
                   arriving_bit=bit, arriving_basis=basis)
        )
    return photons


# ---------------------------------------------------------------------------
# Channel effects
# ---------------------------------------------------------------------------


def apply_noise(photons: list[Photon], noise_rate: float, rng: DeterministicRng) -> None:
    """Channel noise model: bit flip on the arriving encoded state.

    Model (documented for the viva): with probability `noise_rate`, the
    polarization state travelling through the channel flips to the
    *orthogonal state in the same basis* (|0> <-> |1>, |+> <-> |->).
    This is a bit-flip on the encoded classical value while keeping the
    basis unchanged. It mimics depolarizing-like disturbance in a way that
    is easy to reason about and produces exactly the same observable
    effect as a preparation error by Alice.

    It is applied ONCE per photon, before any Eve logic below, and Eve's
    measurement then acts on the (possibly flipped) arriving state -- so
    errors are never double-counted. Channel noise and Eve interference
    remain conceptually distinguishable because the API records Eve's
    per-photon activity separately.
    """
    if noise_rate <= 0:
        return
    for p in photons:
        if rng.random() < noise_rate:
            p.arriving_bit = 1 - p.arriving_bit
            p.noise_flipped = True


def eve_intercept_resend(photons: list[Photon], interception_rate: float,
                         rng: DeterministicRng) -> None:
    """Eve's intercept-resend attack, per photon.

    With probability `interception_rate` Eve intercepts the photon. For
    each intercepted photon she:
      1. picks her own measurement basis uniformly at random,
      2. measures the arriving state by the BB84 rules (same basis ->
         exact bit; conjugate basis -> uniformly random outcome),
      3. resends to Bob a fresh photon in the state corresponding to HER
         result encoded in HER basis.

    Disturbance therefore emerges purely from the measurement process:
    when Eve's basis differs from Alice's, (a) her result is random and
    (b) Bob now measures a state prepared in a different basis, so even a
    basis match between Alice and Bob yields a wrong bit with probability
    1/4 per intercepted photon (Eve picks the wrong basis 1/2 of the time,
    and the conjugate-basis measurement is then wrong 1/2 of the time).

    Why Eve cannot copy the photon: by the No-Cloning Theorem there is no
    unitary operation that duplicates an arbitrary unknown quantum state.
    Eve cannot keep a perfect copy to measure later in the right basis; she
    must measure (and disturb) now. Note the theorem guarantees the
    *possibility of detection in principle* through the induced error rate,
    it does not automatically point at any specific photon -- detection is
    statistical, via the QBER estimated on the test sample.
    """
    if interception_rate <= 0:
        return
    for p in photons:
        if rng.random() >= interception_rate:
            continue
        p.eve_intercepted = True
        p.eve_basis = rng.basis()
        # Eve measures the arriving state.
        if p.eve_basis == p.arriving_basis:
            p.eve_result = p.arriving_bit
        else:
            p.eve_result = rng.bit()
        # Eve resends the state matching her result in her basis.
        p.arriving_bit = p.eve_result
        p.arriving_basis = p.eve_basis


# ---------------------------------------------------------------------------
# Measurement
# ---------------------------------------------------------------------------


def bob_measure(photons: list[Photon], rng: DeterministicRng) -> list[int]:
    """Stage 3 -- Bob picks independent bases and measures.

    Returns Bob's raw bit string (same indexing as `photons`).
    """
    results: list[int] = []
    for p in photons:
        basis = rng.basis()
        if basis == p.arriving_basis:
            result = p.arriving_bit
        else:
            result = rng.bit()
        results.append(result)
        p.bob_basis = basis
        p.bob_result = result
    return results


# ---------------------------------------------------------------------------
# Sifting, parameter estimation, QBER, decision
# ---------------------------------------------------------------------------


@dataclass
class SiftedPosition:
    index: int
    alice_bit: int
    bob_bit: int
    alice_basis: str
    bob_basis: str
    eve_intercepted: bool


def sift(photons: list[Photon]) -> list[SiftedPosition]:
    """Stage 4-5 -- public basis comparison and sifting.

    Alice and Bob announce only their BASIS choices over the public
    channel, never bit values. Positions where the bases match are kept
    (Bob's result equals Alice's bit with certainty in the ideal model);
    the rest are discarded.
    """
    kept: list[SiftedPosition] = []
    for p in photons:
        if p.bob_basis == p.alice_basis:
            kept.append(
                SiftedPosition(
                    index=p.index,
                    alice_bit=p.alice_bit,
                    bob_bit=p.bob_result,
                    alice_basis=p.alice_basis,
                    bob_basis=p.bob_basis,
                    eve_intercepted=p.eve_intercepted,
                )
            )
    return kept


@dataclass
class Estimation:
    """Stage 6-8 -- parameter estimation on a random subset of the sifted key."""

    sample_positions: list[int] = field(default_factory=list)
    sample_details: list[dict] = field(default_factory=list)
    errors: int = 0
    tested: int = 0
    qber: Optional[float] = None  # None when the sample is empty
    qber_std: Optional[float] = None  # standard deviation of QBER estimate
    qber_ci_low: Optional[float] = None  # 95% confidence interval lower bound
    qber_ci_high: Optional[float] = None  # 95% confidence interval upper bound


def estimate_qber(sifted: list[SiftedPosition], sample_fraction: float,
                  rng: DeterministicRng) -> tuple[Estimation, list[SiftedPosition]]:
    """Sample a subset of sifted positions, reveal and compare them.

    Returns (estimation, retained_candidate_key) where the retained key
    excludes the sampled (now publicly revealed) positions.
    """
    n = len(sifted)
    k = int(round(n * sample_fraction))
    # Clamp so the sample never exceeds the sifted key.
    k = max(0, min(k, n))
    # Random subset WITHOUT replacement: shuffle the pool and take the
    # first k positions.
    pool = list(range(n))
    if rng.seeded:
        rng._rng.shuffle(pool)
    else:
        import secrets as _secrets

        _secrets.SystemRandom().shuffle(pool)
    indices = sorted(pool[:k])

    sample_set = set(indices)
    est = Estimation(sample_positions=indices)
    for pos in indices:
        sp = sifted[pos]
        est.tested += 1
        mismatch = sp.alice_bit != sp.bob_bit
        if mismatch:
            est.errors += 1
        est.sample_details.append(
            {
                "index": sp.index,
                "alice_bit": sp.alice_bit,
                "bob_bit": sp.bob_bit,
                "match": not mismatch,
                "eve_intercepted": sp.eve_intercepted,
            }
        )
    if est.tested > 0:
        est.qber = est.errors / est.tested
        # Bernoulli standard deviation: σ = sqrt(p(1-p)/n)
        est.qber_std = math.sqrt(est.qber * (1.0 - est.qber) / est.tested)
        # 95% Wald confidence interval: QBER ± 1.96σ, clamped to [0, 1]
        est.qber_ci_low = max(0.0, est.qber - 1.96 * est.qber_std)
        est.qber_ci_high = min(1.0, est.qber + 1.96 * est.qber_std)
    retained = [sp for i, sp in enumerate(sifted) if i not in sample_set]
    return est, retained


THEORETICAL_EVE_QBER = 0.25
"""Expected QBER contributed by a full intercept-resend attack *among the
sifted bits* for interception rate f: f/4 (Eve picks the wrong basis half
the time, and a conjugate-basis measurement is then wrong half the time,
giving 1/2 × 1/2 = 1/4 per intercepted photon).
At f = 1 this reaches the well-known 25% overall; the commonly quoted
"~11%" (Shor-Preskill) is the maximum tolerable QBER under idealized
security-proof assumptions, treated separately below."""

# The ~11% figure comes from idealized asymptotic security proofs
# (Shor-Preskill one-way post-processing bound). It is NOT a universal
# detector threshold; real systems set device- and protocol-specific limits.
THEORETICAL_THRESHOLD = 0.11


# ---------------------------------------------------------------------------
# Information-theoretic quantities
# ---------------------------------------------------------------------------


def binary_entropy(p: float) -> float:
    """Binary Shannon entropy H(p) = -p log₂(p) - (1-p) log₂(1-p).

    Returns a value in [0, 1]. Handles the boundary cases p=0 and p=1
    where the limit is 0 (0·log 0 ≡ 0 by convention).

    This is the fundamental information-theoretic measure of the
    uncertainty contained in a single Bernoulli trial with bias p.
    """
    if p <= 0.0 or p >= 1.0:
        return 0.0
    return -p * math.log2(p) - (1.0 - p) * math.log2(1.0 - p)


def shor_preskill_key_rate(qber: float) -> float:
    """Asymptotic secure key rate per sifted bit (Shor-Preskill, 2000).

    r = 1 - 2·H(QBER)

    where H is the binary Shannon entropy. This is the fraction of the
    sifted key that survives error correction AND privacy amplification
    under one-way post-processing. The rate goes to zero at
    QBER ≈ 11.0% -- which is precisely the origin of the well-known
    ~11% theoretical threshold.

    At QBER > 11% the rate becomes negative, meaning no secret key can
    be distilled: the eavesdropper's information exceeds the correctable
    capacity.

    Reference: Shor & Preskill, "Simple Proof of Security of the BB84
    Quantum Key Distribution Protocol", Phys. Rev. Lett. 85, 441 (2000).
    """
    if qber <= 0.0:
        return 1.0
    if qber >= 0.5:
        return 0.0
    rate = 1.0 - 2.0 * binary_entropy(qber)
    return max(0.0, rate)  # clamp: negative means no key


def expected_eve_qber(interception_rate: float) -> float:
    """Theoretical QBER induced by an intercept-resend attack.

    For interception rate f, the expected QBER among sifted bits is:

        QBER_Eve = f / 4

    Derivation (per intercepted photon, conditioned on sifting):
      - Eve picks the wrong basis with probability 1/2.
      - When she picks the wrong basis, her result is uniformly random,
        and she resends in the wrong basis. When Bob measures (with the
        correct basis, since the photon is sifted), his result is uniformly
        random, so it disagrees with Alice's bit with probability 1/2.
      - Net error probability per intercepted photon: 1/2 × 1/2 = 1/4.
      - Over all sifted photons: f × 1/4 = f/4.

    At f=1 this gives the well-known 25%.
    """
    return interception_rate / 4.0


def expected_noise_qber(noise_rate: float) -> float:
    """Theoretical QBER from the bit-flip channel noise model.

    A bit-flip channel with error probability p flips the arriving
    polarization to the orthogonal state (same basis) with probability p.
    Among sifted bits (where bases match), the bit is wrong whenever it
    was flipped, so:

        QBER_noise = p
    """
    return noise_rate


def expected_combined_qber(noise_rate: float, interception_rate: float,
                           eve_enabled: bool) -> float:
    """Theoretical combined QBER from independent noise and Eve channels.

    Noise and Eve's intercept-resend are independent bit-flip sources.
    Two independent bit-flip channels with error probabilities p₁ and p₂
    compose via the XOR rule (a bit is wrong iff exactly one source
    flipped it):

        QBER_combined = p₁ + p₂ - 2·p₁·p₂

    This is the standard formula for the composition of two binary
    symmetric channels.
    """
    p_noise = expected_noise_qber(noise_rate)
    p_eve = expected_eve_qber(interception_rate) if eve_enabled else 0.0
    return p_noise + p_eve - 2.0 * p_noise * p_eve


def secure_key_length(retained_bits: int, qber: float) -> int:
    """Estimated secure key length after privacy amplification.

    L_secure ≈ n_retained × max(0, 1 - 2·H(QBER))

    This is the number of bits that would remain after error correction
    and privacy amplification in the asymptotic limit (Shor-Preskill).
    If the key rate is zero or negative, no secure key can be distilled.
    """
    rate = shor_preskill_key_rate(qber)
    return max(0, int(math.floor(retained_bits * rate)))


def decide(qber: Optional[float], threshold: float, retained_len: int) -> tuple[str, str]:
    """Stage 9-10 -- security decision policy.

    Returns (status, rationale). Status is one of:
      PASS         - QBER at or below threshold and retained key non-empty.
      ABORT        - QBER above threshold -> suspected eavesdropping/noise.
      INCONCLUSIVE - sample too small for a meaningful QBER estimate.
    """
    if qber is None:
        return ("INCONCLUSIVE",
                "No sifted test bits were available to estimate the QBER, so no "
                "security statement can be made. The key was discarded.")
    if retained_len == 0:
        return ("INCONCLUSIVE",
                "The QBER was estimated, but no key material remains after "
                "removing the test sample, so the run cannot produce a key.")
    if qber > threshold:
        return ("ABORT",
                f"Observed QBER {qber:.1%} exceeds the configured educational "
                f"abort threshold of {threshold:.1%}. Consistent with "
                f"eavesdropping (intercept-resend) or excess channel noise; "
                f"the key was discarded.")
    return ("PASS",
            f"Observed QBER {qber:.1%} is at or below the configured threshold "
            f"of {threshold:.1%}. Key retained for encryption. NOTE: a low QBER "
            f"does not prove that no eavesdropper exists -- it only fails to "
            f"indicate one in this simplified educational model.")


def encrypt_one_time_pad(message: str, key: bytes) -> dict:
    """Stage 10 -- one-time-pad encryption demonstration.

    The OTP is the textbook pairing for BB84: a truly random key as long as
    the message, used exactly once, gives information-theoretic security.
    Here the key comes from the simulated protocol (so it is only as strong
    as the simulation's randomness). Keys must NEVER be reused; we enforce
    length >= message length and XOR bytes.
    """
    msg_bytes = message.encode("utf-8")
    if len(key) < len(msg_bytes):
        raise ValueError("insufficient key material for one-time pad")
    cipher = bytes(m ^ k for m, k in zip(msg_bytes, key[: len(msg_bytes)]))
    deciphered = bytes(c ^ k for c, k in zip(cipher, key[: len(msg_bytes)]))
    return {
        "cipher_hex": cipher.hex(),
        "decrypted": deciphered.decode("utf-8"),
        "key_used_bits": len(msg_bytes) * 8,
    }
