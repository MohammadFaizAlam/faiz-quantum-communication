/**
 * Typed API contract mirroring backend/app (FastAPI + Pydantic).
 * Keep in sync with backend/app/api/routes.py and backend/app/core/experiment.py.
 */

export type Basis = '+' | 'x'

export type DecisionStatus = 'PASS' | 'ABORT' | 'INCONCLUSIVE'

export interface SimulateRequest {
  n_photons: number
  eve_enabled: boolean
  interception_rate: number
  noise_rate: number
  sample_fraction: number
  threshold: number
  message: string | null
  seed: number | null
}

export interface PhotonRow {
  index: number
  alice_bit: 0 | 1
  alice_basis: Basis
  alice_state: string
  noise_flipped: boolean
  eve_intercepted: boolean
  eve_basis: Basis | null
  eve_result: 0 | 1 | null
  arriving_state: string
  bob_basis: Basis
  bob_result: 0 | 1
  basis_match: boolean
  sifted: boolean
  tested: boolean
  retained: boolean
}

export interface SampleDetail {
  index: number
  alice_bit: 0 | 1
  bob_bit: 0 | 1
  match: boolean
  eve_intercepted: boolean
}

export interface Estimation {
  sample_size: number
  errors: number
  qber: number | null
  qber_std: number | null
  qber_ci_low: number | null
  qber_ci_high: number | null
  sample_details: SampleDetail[]
}

export interface Decision {
  status: DecisionStatus
  rationale: string
  qber_observed: number | null
  threshold_configured: number
  theoretical_reference: number
  theoretical_reference_note: string
  expected_full_intercept_qber: number
  expected_combined_qber?: number
}

export interface RetainedKey {
  length_bits: number
  details: { index: number; alice_bit: 0 | 1; bob_bit: 0 | 1 }[]
}

export interface EncryptionResult {
  permitted: boolean
  method: 'one_time_pad_xor' | null
  reason?: string
  message_length_bytes?: number
  key_used_bits?: number
  remaining_key_bits?: number
  cipher_hex?: string
  decrypted_message?: string
}

export interface LogEntry {
  stage: string
  message: string
  level: 'info' | 'warn' | 'error' | 'success'
}

export interface InformationTheory {
  binary_entropy_of_qber: number | null
  shor_preskill_key_rate: number
  shor_preskill_key_rate_note: string
  secure_key_length_bits: number
  secure_key_length_note: string
}

export interface SimulateResult {
  run_id: string
  config: SimulateRequest
  randomness: { source: string; seeded: boolean }
  photons: PhotonRow[]
  sifted_count: number
  sifting_efficiency?: number
  estimation: Estimation
  decision: Decision
  retained_key: RetainedKey
  information_theory?: InformationTheory
  encryption: EncryptionResult | null
  logs: LogEntry[]
  warnings: string[]
}
