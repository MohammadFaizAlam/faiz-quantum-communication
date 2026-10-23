import { useState, useEffect, useRef } from 'react'
import { Lock, Play, RotateCcw } from 'lucide-react'
import type { SimulateResult } from '../types'
import { Panel, SectionTitle } from './ui'

/**
 * Animated One-Time Pad encryption visualizer.
 * Shows how each character of the plaintext is XORed with the quantum key,
 * bit-by-bit, to produce ciphertext — making the math behind OTP tangible.
 */
export function XorAnimation({ result }: { result: SimulateResult }) {
  const enc = result.encryption
  if (!enc?.permitted || !result.config.message || !enc.cipher_hex) return null

  const message = result.config.message
  const keyBits = result.retained_key.details.map((b) => b.bob_bit)

  // Convert message to binary bytes
  const messageBytes: { char: string; bits: number[] }[] = []
  for (let i = 0; i < message.length; i++) {
    const code = message.charCodeAt(i)
    const bits: number[] = []
    for (let b = 7; b >= 0; b--) {
      bits.push((code >> b) & 1)
    }
    messageBytes.push({ char: message[i], bits })
  }

  // Get the key bits used (8 bits per character)
  const keyByteGroups: number[][] = []
  for (let i = 0; i < messageBytes.length; i++) {
    const group = keyBits.slice(i * 8, i * 8 + 8)
    keyByteGroups.push(group.length === 8 ? group : Array(8).fill(0))
  }

  // XOR to produce cipher bits
  const cipherByteGroups: number[][] = messageBytes.map((mb, i) =>
    mb.bits.map((bit, j) => bit ^ (keyByteGroups[i]?.[j] ?? 0))
  )

  const totalChars = messageBytes.length
  const [revealedChars, setRevealedChars] = useState(0)
  const [activeBit, setActiveBit] = useState(-1) // within current char
  const [isPlaying, setIsPlaying] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  useEffect(() => {
    clearTimer()
    if (!isPlaying) return

    // Animate through bits of the current character
    if (revealedChars >= totalChars) {
      setIsPlaying(false)
      return
    }

    if (activeBit < 7) {
      timerRef.current = setTimeout(() => {
        setActiveBit((b) => b + 1)
      }, 80) // Fast bit-level animation
    } else {
      // Move to next character
      timerRef.current = setTimeout(() => {
        setRevealedChars((c) => c + 1)
        setActiveBit(-1)
      }, 300) // Pause between chars
    }

    return clearTimer
  }, [isPlaying, activeBit, revealedChars, totalChars])

  // When revealedChars changes and we're playing, start the next char's bits
  useEffect(() => {
    if (isPlaying && activeBit === -1 && revealedChars < totalChars) {
      const t = setTimeout(() => setActiveBit(0), 150)
      return () => clearTimeout(t)
    }
  }, [isPlaying, revealedChars, activeBit, totalChars])

  const handlePlay = () => {
    if (revealedChars >= totalChars) {
      setRevealedChars(0)
      setActiveBit(-1)
    }
    setIsPlaying(true)
  }

  const handleReset = () => {
    setIsPlaying(false)
    clearTimer()
    setRevealedChars(0)
    setActiveBit(-1)
  }

  // Determine how many chars are visible (fully revealed + currently animating)
  const visibleCount = Math.min(revealedChars + (activeBit >= 0 ? 1 : 0), totalChars)
  const isDone = revealedChars >= totalChars

  return (
    <Panel className="fade-in-up">
      <div className="p-4 sm:p-6">
        <SectionTitle
          eyebrow="one-time pad encryption"
          title="XOR Encryption: Bit-by-Bit Breakdown"
          icon={<Lock className="size-4" aria-hidden />}
        >
          <div className="font-mono text-xs text-ink-400">
            {message.length} chars · {message.length * 8} bits
          </div>
        </SectionTitle>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-5">
          <button
            type="button"
            onClick={handlePlay}
            disabled={isPlaying}
            className="inline-flex items-center gap-1.5 rounded-lg border border-signal-500/30 bg-signal-500/10 px-3.5 py-2 text-[12px] font-semibold text-signal-300 transition-all hover:bg-signal-500/20 disabled:opacity-40"
          >
            <Play className="size-3.5" aria-hidden />
            {isDone ? 'Replay' : 'Animate Encryption'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-abyss-600 bg-abyss-800/60 px-3 py-2 text-[12px] font-semibold text-ink-300 transition-all hover:text-ink-100"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            Reset
          </button>
          {isDone && (
            <span className="text-[12px] font-semibold text-pass-400 font-mono">
              ✓ Encryption complete
            </span>
          )}
        </div>

        {/* The formula legend */}
        <div className="mb-4 sm:mb-5 flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] sm:text-[11.5px] font-mono text-ink-400">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 sm:size-3 rounded-sm bg-alice-500/60" />
            Message bits
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 sm:size-3 rounded-sm bg-signal-500/60" />
            Quantum key bits
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 sm:size-3 rounded-sm bg-pass-400/60" />
            Ciphertext (M ⊕ K)
          </span>
        </div>

        {/* Mobile scroll hint */}
        <div className="sm:hidden text-[10.5px] font-mono text-ink-500 mb-2">
          ← Scroll table horizontally to view all bits →
        </div>

        {/* XOR table — each row is one character */}
        <div className="overflow-x-auto scrollbar-thin pb-2">
          <div className="inline-block min-w-[540px] sm:min-w-[620px]">
            {/* Header row */}
            <div className="grid grid-cols-[50px_1fr_1fr_1fr_70px] sm:grid-cols-[60px_1fr_1fr_1fr_80px] gap-x-2 sm:gap-x-3 mb-2 text-[10px] font-mono font-bold tracking-wider text-ink-500 uppercase px-2">
              <div>Char</div>
              <div>Message Bits</div>
              <div>Key Bits</div>
              <div>Cipher Bits</div>
              <div>Hex</div>
            </div>

            {/* Character rows */}
            <div className="space-y-1">
              {messageBytes.slice(0, visibleCount).map((mb, charIdx) => {
                const isCurrentChar = charIdx === revealedChars && activeBit >= 0
                const isFullyRevealed = charIdx < revealedChars
                const keyGroup = keyByteGroups[charIdx]
                const cipherGroup = cipherByteGroups[charIdx]

                // How many bits of this character are visible
                const visibleBits = isFullyRevealed ? 8 : isCurrentChar ? activeBit + 1 : 0

                // Hex for this byte
                const cipherByte = cipherGroup.reduce((acc, b, i) => acc | (b << (7 - i)), 0)
                const hexStr = cipherByte.toString(16).toUpperCase().padStart(2, '0')

                return (
                  <div
                    key={charIdx}
                    className={`grid grid-cols-[50px_1fr_1fr_1fr_70px] sm:grid-cols-[60px_1fr_1fr_1fr_80px] gap-x-2 sm:gap-x-3 items-center rounded-lg px-2 py-1.5 sm:py-2 transition-all duration-300 ${
                      isCurrentChar
                        ? 'bg-signal-500/[0.06] border border-signal-500/20'
                        : 'border border-transparent hover:bg-abyss-850/40'
                    }`}
                  >
                    {/* Character */}
                    <div className="font-mono text-xs sm:text-sm font-bold text-ink-100 text-center bg-abyss-800 rounded-md py-1 border border-abyss-700">
                      {mb.char === ' ' ? '␣' : mb.char}
                    </div>

                    {/* Message bits */}
                    <div className="flex gap-0.5">
                      {mb.bits.map((bit, bi) => (
                        <span
                          key={bi}
                          className={`grid size-5 sm:size-6 place-items-center rounded font-mono text-[11px] sm:text-xs font-bold transition-all duration-150 ${
                            bi < visibleBits
                              ? 'bg-alice-500/15 text-alice-400 border border-alice-500/30'
                              : 'bg-abyss-900 text-ink-600 border border-abyss-800'
                          } ${bi === activeBit && isCurrentChar ? 'ring-1 ring-alice-400/60 scale-110' : ''}`}
                        >
                          {bi < visibleBits ? bit : '·'}
                        </span>
                      ))}
                    </div>

                    {/* Key bits */}
                    <div className="flex gap-0.5">
                      {keyGroup.map((bit, bi) => (
                        <span
                          key={bi}
                          className={`grid size-5 sm:size-6 place-items-center rounded font-mono text-[11px] sm:text-xs font-bold transition-all duration-150 ${
                            bi < visibleBits
                              ? 'bg-signal-500/15 text-signal-300 border border-signal-500/30'
                              : 'bg-abyss-900 text-ink-600 border border-abyss-800'
                          } ${bi === activeBit && isCurrentChar ? 'ring-1 ring-signal-400/60 scale-110' : ''}`}
                        >
                          {bi < visibleBits ? bit : '·'}
                        </span>
                      ))}
                    </div>

                    {/* Cipher bits */}
                    <div className="flex gap-0.5">
                      {cipherGroup.map((bit, bi) => (
                        <span
                          key={bi}
                          className={`grid size-5 sm:size-6 place-items-center rounded font-mono text-[11px] sm:text-xs font-bold transition-all duration-150 ${
                            bi < visibleBits
                              ? 'bg-pass-400/15 text-pass-400 border border-pass-400/30'
                              : 'bg-abyss-900 text-ink-600 border border-abyss-800'
                          } ${bi === activeBit && isCurrentChar ? 'ring-1 ring-pass-400/60 scale-110' : ''}`}
                        >
                          {bi < visibleBits ? bit : '·'}
                        </span>
                      ))}
                    </div>

                    {/* Hex result */}
                    <div className={`font-mono text-sm font-bold text-center rounded-md py-1 transition-all ${
                      isFullyRevealed
                        ? 'bg-pass-400/10 text-pass-400 border border-pass-400/25'
                        : 'bg-abyss-900 text-ink-600 border border-abyss-800'
                    }`}>
                      {isFullyRevealed ? `0x${hexStr}` : '??'}
                    </div>
                  </div>
                )
              })}

              {/* Remaining chars placeholder */}
              {visibleCount < totalChars && (
                <div className="px-2 py-3 text-center text-[12px] text-ink-500 font-mono">
                  {totalChars - visibleCount} more character{totalChars - visibleCount > 1 ? 's' : ''} remaining…
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary row after completion */}
        {isDone && (
          <div className="mt-5 rounded-xl border border-pass-400/25 bg-pass-400/[0.04] p-4 fade-in-up">
            <div className="grid gap-3 sm:grid-cols-3 text-[12.5px]">
              <div>
                <div className="font-mono text-[10px] font-semibold tracking-wider text-ink-500 uppercase mb-1">
                  Original Message
                </div>
                <div className="font-mono text-sm font-bold text-ink-100">"{message}"</div>
              </div>
              <div>
                <div className="font-mono text-[10px] font-semibold tracking-wider text-ink-500 uppercase mb-1">
                  Full Ciphertext (Hex)
                </div>
                <div className="font-mono text-sm font-bold text-signal-300 break-all">{enc.cipher_hex}</div>
              </div>
              <div>
                <div className="font-mono text-[10px] font-semibold tracking-wider text-ink-500 uppercase mb-1">
                  Decrypted Back
                </div>
                <div className="font-mono text-sm font-bold text-pass-400">
                  {enc.decrypted_message === message ? `"${enc.decrypted_message}" ✓` : `"${enc.decrypted_message}" ✗`}
                </div>
              </div>
            </div>
            <p className="mt-3 text-[11.5px] text-ink-400 leading-relaxed">
              Each message bit was XORed with a unique quantum key bit. Because the key is truly random and never reused,
              this One-Time Pad provides mathematically unbreakable encryption — the ciphertext carries zero information about the original message
              without the key.
            </p>
          </div>
        )}
      </div>
    </Panel>
  )
}
