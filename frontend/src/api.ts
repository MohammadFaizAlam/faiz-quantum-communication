import type { SimulateRequest, SimulateResult } from './types'

export class ApiError extends Error {
  status: number
  detail: unknown

  constructor(message: string, status: number, detail: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || ''

/**
 * POST /api/simulate.
 * Takes an AbortSignal so a newer run can cancel a stale in-flight request;
 * aborted requests throw a DOMException the caller can recognize.
 */
export async function simulate(
  req: SimulateRequest,
  signal: AbortSignal,
): Promise<SimulateResult> {
  let res: Response
  try {
    res = await fetch(`${API_BASE}/api/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
      signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new ApiError(
      `Could not reach the simulation backend. Please ensure the backend is running.`,
      0,
      err,
    )
  }
  if (!res.ok) {
    let detail: unknown = null
    try {
      detail = await res.json()
    } catch {
      /* non-JSON error body */
    }
    // FastAPI validation errors carry a human-readable summary in detail.
    const summary =
      detail && typeof detail === 'object' && 'detail' in detail
        ? JSON.stringify((detail as { detail: unknown }).detail)
        : `Request failed with status ${res.status}.`
    throw new ApiError(summary, res.status, detail)
  }
  return (await res.json()) as SimulateResult
}
