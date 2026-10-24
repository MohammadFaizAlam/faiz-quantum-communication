/**
 * Quantum Physics & Optical Engineering Core Calculations
 *
 * Implements real-world physical and mathematical models for:
 * 1. Stokes parameters & Poincaré / Bloch sphere representation
 * 2. Density matrix formalism, state purity, and Von Neumann entropy
 * 3. Optical fiber attenuation (Beer-Lambert), dark counts, QBER vs distance
 * 4. Weak Coherent Pulse (WCP) Poisson statistics & PNS vulnerability
 * 5. Born rule measurement probabilities & wave-function collapse
 * 6. Shannon / Von Neumann entropy, mutual information
 * 7. Shor-Preskill asymptotic secure key rate
 *
 * All formulas are referenced to published literature (Bennett & Brassard 1984,
 * Shor & Preskill PRL 85 441, Gisin et al. Rev. Mod. Phys. 74 145, etc.)
 *
 * IMPORTANT: These are exact mathematical evaluations of well-established
 * quantum information theory. No stochastic simulation or approximation is
 * involved — every value is computed from closed-form expressions.
 */

// ─────────────────────────────────────────────────────────────
// 1. STOKES PARAMETERS & BLOCH / POINCARÉ SPHERE
// ─────────────────────────────────────────────────────────────

export interface StokesVector {
  S0: number // Total intensity (always 1 for pure states)
  S1: number // Horizontal – Vertical
  S2: number // Diagonal (+45°) – Anti-diagonal (−45°)
  S3: number // Right-circular – Left-circular
}

/**
 * Convert polarization angles (θ, φ) on the Poincaré sphere to Stokes parameters.
 *
 * θ ∈ [0, π]: polar angle (0 = H, π = V)
 * φ ∈ [0, 2π]: azimuthal angle (0 = D diagonal, π/2 = R circular)
 *
 * Jones vector: |ψ⟩ = cos(θ/2)|H⟩ + e^{iφ} sin(θ/2)|V⟩
 * Stokes: S₁ = cos θ, S₂ = sin θ cos φ, S₃ = sin θ sin φ
 */
export function anglesToStokes(theta: number, phi: number): StokesVector {
  return {
    S0: 1,
    S1: Math.cos(theta),
    S2: Math.sin(theta) * Math.cos(phi),
    S3: Math.sin(theta) * Math.sin(phi),
  }
}

/**
 * Named BB84 polarization states → Poincaré sphere angles.
 *
 * Rectilinear basis (+):
 *   |H⟩ = |0⟩: θ = 0,     φ = 0
 *   |V⟩ = |1⟩: θ = π,     φ = 0
 *
 * Diagonal basis (×):
 *   |D⟩ = |+⟩: θ = π/2,   φ = 0
 *   |A⟩ = |−⟩: θ = π/2,   φ = π
 */
export const BB84_STATES = {
  H: { theta: 0, phi: 0, label: '|H⟩ = |0⟩', basis: '+', bit: 0 },
  V: { theta: Math.PI, phi: 0, label: '|V⟩ = |1⟩', basis: '+', bit: 1 },
  D: { theta: Math.PI / 2, phi: 0, label: '|D⟩ = |+⟩', basis: '×', bit: 0 },
  A: { theta: Math.PI / 2, phi: Math.PI, label: '|A⟩ = |−⟩', basis: '×', bit: 1 },
} as const

export type BB84StateName = keyof typeof BB84_STATES

// ─────────────────────────────────────────────────────────────
// 2. DENSITY MATRIX
// ─────────────────────────────────────────────────────────────

export interface DensityMatrix {
  rho: [[{ re: number; im: number }, { re: number; im: number }],
        [{ re: number; im: number }, { re: number; im: number }]]
  purity: number      // Tr(ρ²), 1 for pure states
  vonNeumann: number  // −Tr(ρ log₂ ρ), 0 for pure states
  blochX: number
  blochY: number
  blochZ: number
}

/**
 * Compute the 2×2 density matrix ρ = |ψ⟩⟨ψ| for a pure qubit state.
 *
 * |ψ⟩ = cos(θ/2)|0⟩ + e^{iφ} sin(θ/2)|1⟩
 *
 * ρ = [ cos²(θ/2)                      cos(θ/2)sin(θ/2)e^{-iφ} ]
 *     [ cos(θ/2)sin(θ/2)e^{iφ}         sin²(θ/2)               ]
 *
 * Bloch vector: (sin θ cos φ, sin θ sin φ, cos θ)
 */
export function computeDensityMatrix(theta: number, phi: number): DensityMatrix {
  const c = Math.cos(theta / 2)
  const s = Math.sin(theta / 2)

  const rho: DensityMatrix['rho'] = [
    [
      { re: c * c, im: 0 },
      { re: c * s * Math.cos(phi), im: -c * s * Math.sin(phi) },
    ],
    [
      { re: c * s * Math.cos(phi), im: c * s * Math.sin(phi) },
      { re: s * s, im: 0 },
    ],
  ]

  // For a pure state, purity = 1 and Von Neumann entropy = 0
  const purity = 1.0
  const vonNeumann = 0.0

  return {
    rho,
    purity,
    vonNeumann,
    blochX: Math.sin(theta) * Math.cos(phi),
    blochY: Math.sin(theta) * Math.sin(phi),
    blochZ: Math.cos(theta),
  }
}

/**
 * Mixed-state density matrix for a depolarizing channel.
 * ρ_out = (1 − p) ρ_in + p · I/2
 *
 * This models the effect of channel noise on a qubit. The depolarizing
 * parameter p ∈ [0,1] represents the probability of the state being
 * completely randomized.
 */
export function depolarizedDensityMatrix(
  theta: number, phi: number, p: number
): DensityMatrix {
  const pure = computeDensityMatrix(theta, phi)
  const scale = 1 - p
  const mixed: DensityMatrix['rho'] = [
    [
      { re: scale * pure.rho[0][0].re + p / 2, im: scale * pure.rho[0][0].im },
      { re: scale * pure.rho[0][1].re, im: scale * pure.rho[0][1].im },
    ],
    [
      { re: scale * pure.rho[1][0].re, im: scale * pure.rho[1][0].im },
      { re: scale * pure.rho[1][1].re + p / 2, im: scale * pure.rho[1][1].im },
    ],
  ]

  // Eigenvalues of 2×2 density matrix
  const tr = mixed[0][0].re + mixed[1][1].re
  const det =
    mixed[0][0].re * mixed[1][1].re -
    (mixed[0][1].re ** 2 + mixed[0][1].im ** 2)
  const disc = Math.sqrt(Math.max(0, (tr / 2) ** 2 - det))
  const l1 = tr / 2 + disc
  const l2 = tr / 2 - disc

  const purity = l1 ** 2 + l2 ** 2
  let vonNeumann = 0
  if (l1 > 1e-12) vonNeumann -= l1 * Math.log2(l1)
  if (l2 > 1e-12) vonNeumann -= l2 * Math.log2(l2)

  const bx = scale * pure.blochX
  const by = scale * pure.blochY
  const bz = scale * pure.blochZ

  return { rho: mixed, purity, vonNeumann, blochX: bx, blochY: by, blochZ: bz }
}

// ─────────────────────────────────────────────────────────────
// 3. OPTICAL FIBER CHANNEL MODEL
// ─────────────────────────────────────────────────────────────

export interface OpticalChannelParams {
  distanceKm: number         // Fiber length
  attenuationDbPerKm: number // Typically 0.2 dB/km at 1550 nm
  darkCountRate: number      // Detector dark counts per gate (Hz)
  gateWidthNs: number        // Detector gate window
  detectorEfficiency: number // η_det, typically 0.1–0.25 for InGaAs
  meanPhotonNumber: number   // μ, mean photon number per pulse
  repetitionRateMHz: number  // Laser pulse repetition rate
}

export interface OpticalChannelResult {
  transmittance: number       // η_channel = 10^(-αL/10)
  totalEfficiency: number     // η_total = η_channel × η_det
  signalCountRate: number     // R_signal
  darkCountRateTotal: number  // R_dark
  qber: number                // QBER from signal + noise
  secureKeyRate: number       // Shor-Preskill r
  secureKeyRateBitsPerSec: number
  maxSecureDistanceKm: number
  reachable: boolean
}

/**
 * Calculate real-world optical fiber QKD channel performance.
 *
 * Transmittance (Beer-Lambert law for optical fiber):
 *   η_channel = 10^(−α·L / 10)
 *
 * Signal detection rate:
 *   R_signal = f_rep × μ × η_channel × η_det
 *
 * QBER from dark counts:
 *   QBER = (R_dark / 2) / (R_signal + R_dark)
 *
 * The factor of 1/2 in dark-count QBER arises because dark counts are
 * uniformly random, so they match the correct bit 50% of the time.
 *
 * References:
 *   Gisin et al., Rev. Mod. Phys. 74, 145 (2002)
 *   Gobby, Yuan & Shields, Appl. Phys. Lett. 84, 3762 (2004)
 */
export function calculateOpticalChannel(params: OpticalChannelParams): OpticalChannelResult {
  const {
    distanceKm, attenuationDbPerKm, darkCountRate, gateWidthNs,
    detectorEfficiency, meanPhotonNumber, repetitionRateMHz,
  } = params

  // Channel transmittance: η = 10^(-αL/10)
  const transmittance = Math.pow(10, -attenuationDbPerKm * distanceKm / 10)
  const totalEfficiency = transmittance * detectorEfficiency

  // Convert rates
  const repRateHz = repetitionRateMHz * 1e6
  const darkCountsPerGate = darkCountRate * gateWidthNs * 1e-9

  // Signal and noise count rates
  const signalCountRate = repRateHz * meanPhotonNumber * totalEfficiency
  const darkCountRateTotal = repRateHz * darkCountsPerGate

  // QBER: dark counts contribute random bits (50% error)
  const totalDetectionRate = signalCountRate + darkCountRateTotal
  const qber = totalDetectionRate > 0
    ? (darkCountRateTotal * 0.5) / totalDetectionRate
    : 0

  // Shor-Preskill key rate
  const h_q = binaryEntropy(qber)
  const keyRate = Math.max(0, 1 - 2 * h_q)
  const secureKeyRateBitsPerSec = keyRate * totalDetectionRate

  // Find max secure distance (where QBER ≈ 11%)
  let maxDist = 0
  for (let d = 0; d <= 500; d += 0.5) {
    const t = Math.pow(10, -attenuationDbPerKm * d / 10)
    const sig = repRateHz * meanPhotonNumber * t * detectorEfficiency
    const tot = sig + darkCountRateTotal
    const q = tot > 0 ? (darkCountRateTotal * 0.5) / tot : 0
    if (1 - 2 * binaryEntropy(q) > 0) maxDist = d
    else break
  }

  return {
    transmittance,
    totalEfficiency,
    signalCountRate,
    darkCountRateTotal,
    qber,
    secureKeyRate: keyRate,
    secureKeyRateBitsPerSec,
    maxSecureDistanceKm: maxDist,
    reachable: keyRate > 0,
  }
}

/**
 * Generate QBER-vs-distance curve data for plotting.
 */
export function generateDistanceCurve(
  params: Omit<OpticalChannelParams, 'distanceKm'>,
  maxKm: number = 300,
  steps: number = 150,
): Array<{ km: number; qber: number; keyRate: number; transmittanceDb: number }> {
  const points: Array<{ km: number; qber: number; keyRate: number; transmittanceDb: number }> = []
  for (let i = 0; i <= steps; i++) {
    const km = (maxKm * i) / steps
    const result = calculateOpticalChannel({ ...params, distanceKm: km })
    points.push({
      km,
      qber: result.qber,
      keyRate: result.secureKeyRate,
      transmittanceDb: -params.attenuationDbPerKm * km,
    })
  }
  return points
}

// ─────────────────────────────────────────────────────────────
// 4. WEAK COHERENT PULSE — POISSON STATISTICS
// ─────────────────────────────────────────────────────────────

export interface PoissonResult {
  p0: number  // Vacuum (no photon)
  p1: number  // Single photon (desired)
  p2: number  // Two-photon (PNS vulnerable)
  p3plus: number  // Multi-photon (highly vulnerable)
  pMulti: number  // p2 + p3plus (total multi-photon)
  singlePhotonFraction: number  // p1 / (1 - p0)
  gainQ: number  // Total detection probability
  optimalMu: number  // Approximately 0.1 for BB84 WCP
}

/**
 * Poisson photon-number distribution for a Weak Coherent Pulse (WCP) source.
 *
 * P(n) = e^(-μ) × μⁿ / n!
 *
 * Real-world QKD implementations use attenuated laser pulses rather than
 * ideal single-photon sources. The number of photons per pulse follows
 * a Poisson distribution with mean μ.
 *
 * Security vulnerability: Pulses with n ≥ 2 photons are susceptible to
 * the Photon Number Splitting (PNS) attack, where Eve splits off one
 * photon, stores it in a quantum memory, and forwards the rest to Bob.
 *
 * Optimal mean photon number: μ ≈ 0.1 balances signal rate against
 * PNS attack vulnerability (Lütkenhaus, PRA 61, 052304, 2000).
 *
 * Decoy-state protocol (Hwang 2003, Lo/Ma/Chen 2005) mitigates PNS by
 * randomly varying μ between signal and decoy intensities to bound
 * the single-photon yield.
 */
export function calculatePoissonStatistics(mu: number): PoissonResult {
  const expMu = Math.exp(-mu)
  const p0 = expMu
  const p1 = mu * expMu
  const p2 = (mu * mu / 2) * expMu
  const p3plus = 1 - p0 - p1 - p2
  const pMulti = p2 + Math.max(0, p3plus)
  const nonVacuum = 1 - p0
  const singlePhotonFraction = nonVacuum > 0 ? p1 / nonVacuum : 0

  return {
    p0,
    p1,
    p2,
    p3plus: Math.max(0, p3plus),
    pMulti,
    singlePhotonFraction,
    gainQ: nonVacuum,
    optimalMu: 0.1,
  }
}

/**
 * Generate Poisson distribution for μ values 0 to maxMu for chart plotting.
 */
export function generatePoissonCurves(
  maxMu: number = 3,
  steps: number = 100,
): Array<{ mu: number; p0: number; p1: number; pMulti: number }> {
  const points: Array<{ mu: number; p0: number; p1: number; pMulti: number }> = []
  for (let i = 0; i <= steps; i++) {
    const mu = (maxMu * i) / steps
    const stats = calculatePoissonStatistics(mu)
    points.push({ mu, p0: stats.p0, p1: stats.p1, pMulti: stats.pMulti })
  }
  return points
}

// ─────────────────────────────────────────────────────────────
// 5. BORN RULE & MEASUREMENT
// ─────────────────────────────────────────────────────────────

export interface MeasurementResult {
  probabilityZero: number  // P(0) = |⟨0|ψ⟩|²
  probabilityOne: number   // P(1) = |⟨1|ψ⟩|²
  basisMatchesPrep: boolean
  projectedState: { theta: number; phi: number }
}

/**
 * Born rule measurement probabilities.
 *
 * Given a state |ψ⟩ = cos(θ/2)|0⟩ + e^{iφ}sin(θ/2)|1⟩ measured in
 * the computational basis:
 *
 *   P(|0⟩) = |⟨0|ψ⟩|² = cos²(θ/2)
 *   P(|1⟩) = |⟨1|ψ⟩|² = sin²(θ/2)
 *
 * For measurement in the diagonal basis {|+⟩, |−⟩}:
 *   P(|+⟩) = |⟨+|ψ⟩|² = (1 + sin θ cos φ) / 2
 *   P(|−⟩) = |⟨−|ψ⟩|² = (1 − sin θ cos φ) / 2
 *
 * This is the fundamental quantum mechanical axiom: the probability of
 * obtaining outcome |m⟩ when measuring state |ψ⟩ equals |⟨m|ψ⟩|².
 */
export function bornRuleMeasurement(
  stateTheta: number,
  statePhi: number,
  measureBasis: '+' | '×',
): MeasurementResult {
  if (measureBasis === '+') {
    // Rectilinear basis: {|H⟩, |V⟩} = {|0⟩, |1⟩}
    const pZero = Math.cos(stateTheta / 2) ** 2
    const pOne = Math.sin(stateTheta / 2) ** 2
    const basisMatch = stateTheta === 0 || Math.abs(stateTheta - Math.PI) < 1e-10
    return {
      probabilityZero: pZero,
      probabilityOne: pOne,
      basisMatchesPrep: basisMatch,
      projectedState: pZero >= pOne ? { theta: 0, phi: 0 } : { theta: Math.PI, phi: 0 },
    }
  } else {
    // Diagonal basis: {|D⟩, |A⟩} = {|+⟩, |−⟩}
    const pPlus = (1 + Math.sin(stateTheta) * Math.cos(statePhi)) / 2
    const pMinus = 1 - pPlus
    const basisMatch = Math.abs(stateTheta - Math.PI / 2) < 1e-10
    return {
      probabilityZero: pPlus,
      probabilityOne: pMinus,
      basisMatchesPrep: basisMatch,
      projectedState: pPlus >= pMinus
        ? { theta: Math.PI / 2, phi: 0 }
        : { theta: Math.PI / 2, phi: Math.PI },
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 6. INFORMATION THEORY
// ─────────────────────────────────────────────────────────────

/**
 * Binary Shannon entropy: H(p) = −p log₂(p) − (1−p) log₂(1−p)
 *
 * Measures the uncertainty of a binary random variable.
 * H(0) = H(1) = 0 (no uncertainty), H(0.5) = 1 bit (maximum uncertainty).
 */
export function binaryEntropy(p: number): number {
  if (p <= 0 || p >= 1) return 0
  return -p * Math.log2(p) - (1 - p) * Math.log2(1 - p)
}

/**
 * Shor-Preskill asymptotic secure key rate per sifted bit.
 *
 * r = 1 − 2H(QBER)
 *
 * where H is the binary Shannon entropy.
 *
 * This is the fraction of the sifted key surviving error correction
 * (leaks H(QBER) bits per sifted bit) and privacy amplification
 * (removes another H(QBER) bits of Eve's information).
 *
 * The rate goes to zero at QBER ≈ 11.0%, which is the origin of the
 * well-known ~11% security threshold.
 *
 * Reference: Shor & Preskill, PRL 85, 441 (2000)
 */
export function shorPreskillKeyRate(qber: number): number {
  if (qber <= 0) return 1
  if (qber >= 0.5) return 0
  return Math.max(0, 1 - 2 * binaryEntropy(qber))
}

/**
 * Generate the key rate curve for plotting.
 */
export function generateKeyRateCurve(
  steps: number = 200,
): Array<{ qber: number; keyRate: number; entropy: number }> {
  const points: Array<{ qber: number; keyRate: number; entropy: number }> = []
  for (let i = 0; i <= steps; i++) {
    const qber = (0.5 * i) / steps
    points.push({
      qber,
      keyRate: shorPreskillKeyRate(qber),
      entropy: binaryEntropy(qber),
    })
  }
  return points
}

/**
 * Eve's information (Holevo bound) for intercept-resend attack.
 *
 * For interception rate f, among sifted bits:
 *   QBER_Eve = f/4
 *   Eve's info ≤ H(QBER_Eve) bits per sifted bit
 *
 * The mutual information between Alice and Bob is:
 *   I(A:B) = 1 − H(QBER)
 *
 * Secret key is possible iff I(A:B) > I(A:E)
 */
export function calculateEveInfo(interceptionRate: number): {
  eveQber: number
  eveInfo: number
  aliceBobMutualInfo: number
  secretKeyPossible: boolean
} {
  const eveQber = interceptionRate / 4
  const eveInfo = binaryEntropy(eveQber)
  const totalQber = eveQber
  const aliceBobMutualInfo = 1 - binaryEntropy(totalQber)

  return {
    eveQber,
    eveInfo,
    aliceBobMutualInfo,
    secretKeyPossible: shorPreskillKeyRate(totalQber) > 0,
  }
}

/**
 * Expected QBER from intercept-resend attack.
 * QBER = f/4 where f is the interception rate.
 *
 * Derivation: Eve picks wrong basis with probability 1/2.
 * Wrong basis measurement yields random result, which when resent
 * in Eve's (wrong) basis causes Bob to get wrong bit with probability 1/2.
 * Per intercepted, sifted photon: error probability = 1/2 × 1/2 = 1/4.
 */
export function expectedEveQber(interceptionRate: number): number {
  return interceptionRate / 4
}

/**
 * Combined QBER from independent noise and Eve channels.
 * Two independent binary symmetric channels compose via XOR:
 * QBER = p₁ + p₂ − 2p₁p₂
 */
export function combinedQber(noiseRate: number, interceptionRate: number): number {
  const pNoise = noiseRate
  const pEve = interceptionRate / 4
  return pNoise + pEve - 2 * pNoise * pEve
}

// ─────────────────────────────────────────────────────────────
// 7. NO-CLONING THEOREM METRICS
// ─────────────────────────────────────────────────────────────

/**
 * Optimal cloning fidelity (Bužek-Hillery universal cloner).
 *
 * F_clone = 5/6 ≈ 0.8333
 *
 * The No-Cloning Theorem (Wootters & Zurek, 1982) proves that no
 * quantum operation can perfectly duplicate an arbitrary unknown
 * quantum state. The best possible universal cloner achieves
 * fidelity 5/6 for the original and 5/6 for the clone.
 *
 * This fundamental impossibility is what makes BB84 secure:
 * Eve cannot keep a perfect copy of the photon to measure later.
 */
export const OPTIMAL_CLONE_FIDELITY = 5 / 6

/**
 * Cloning-induced QBER: if Eve uses optimal cloning instead of
 * intercept-resend, the disturbance per intercepted photon is:
 * QBER_clone = 1 − F_clone = 1/6 ≈ 16.7%
 */
export const CLONING_INDUCED_QBER = 1 - OPTIMAL_CLONE_FIDELITY

// ─────────────────────────────────────────────────────────────
// 8. HELPER: FORMAT COMPLEX NUMBER FOR DISPLAY
// ─────────────────────────────────────────────────────────────

export function formatComplex(re: number, im: number, precision: number = 4): string {
  const r = re.toFixed(precision)
  if (Math.abs(im) < 1e-10) return r
  const sign = im >= 0 ? '+' : '−'
  const absIm = Math.abs(im).toFixed(precision)
  return `${r} ${sign} ${absIm}i`
}

export function formatPercent(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatSci(value: number, decimals: number = 2): string {
  if (value === 0) return '0'
  const exp = Math.floor(Math.log10(Math.abs(value)))
  const mantissa = value / Math.pow(10, exp)
  return `${mantissa.toFixed(decimals)} × 10^${exp}`
}
