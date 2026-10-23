import {
  BookOpen,
  ArrowLeft,
  Atom,
  Sliders,
  Radio,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'

export function ProtocolGuidePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-10 slide-in">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-[13px] font-medium text-ink-400 transition-all hover:text-signal-300 mb-8 group"
      >
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden />
        Back to Workbench
      </Link>

      {/* Hero Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="grid size-10 place-items-center rounded-xl bg-signal-500/10 border border-signal-500/20">
            <Atom className="size-5 text-signal-400" aria-hidden />
          </div>
          <div className="font-mono text-[11px] font-semibold tracking-[0.2em] text-signal-400 uppercase">
            Viva Guide &amp; Concept Manual
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-ink-100 sm:text-3xl">
          Understanding Quantum Secure Communication (BB84)
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-300 max-w-3xl">
          Everything you need to know to understand this project, how each control works,
          and why quantum physics makes secret eavesdropping physically impossible — explained
          in plain English without overwhelming academic jargon.
        </p>
      </div>

      <div className="space-y-8">
        {/* ── SECTION 1: THE BIG PICTURE ── */}
        <article className="glass-card rounded-xl overflow-hidden fade-in-up">
          <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-abyss-700/50 bg-gradient-to-r from-signal-500/[0.04] to-transparent">
            <div className="grid size-9 place-items-center rounded-lg bg-signal-500/10 border border-signal-500/20 text-signal-400">
              <Sparkles className="size-4.5" aria-hidden />
            </div>
            <div>
              <span className="font-mono text-[10.5px] font-semibold tracking-wider text-signal-400/80 uppercase">Part 01</span>
              <h2 className="text-base font-bold text-ink-100 tracking-tight">
                The Big Picture: What is this Project About?
              </h2>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-4 text-[13px] sm:text-[13.5px] leading-[1.7] sm:leading-[1.75] text-ink-300">
            <div className="rounded-xl border border-abyss-700/50 bg-abyss-850/50 p-4">
              <h3 className="font-semibold text-ink-100 text-[14px] mb-1">
                The Real-World Problem:
              </h3>
              <p>
                In classical telecommunications (like standard fiber cables, WiFi, or phone wires), data travels as electrical voltages or light pulses. A spy (traditionally named <strong className="text-eve-400">Eve</strong>) can secretly tap into the cable, duplicate the signal, and read your private conversations without you or the receiver ever knowing.
              </p>
            </div>

            <div className="rounded-xl border border-signal-500/20 bg-signal-500/[0.04] p-4">
              <h3 className="font-semibold text-signal-300 text-[14px] mb-1">
                The Quantum Physics Solution (BB84 Protocol):
              </h3>
              <p>
                Instead of sending strong electrical signals, Alice transmits <strong className="text-ink-100 font-semibold">single particles of light (photons)</strong>, polarized at specific angles. According to the fundamental laws of quantum physics (the <em>No-Cloning Theorem</em> and <em>Heisenberg's Uncertainty Principle</em>), <strong className="text-ink-100">an unknown quantum particle cannot be copied without being disturbed</strong>.
              </p>
              <p className="mt-2 text-ink-200">
                👉 If Eve tries to spy on the photon, she <strong className="text-eve-400">unavoidably alters its state</strong>. When Alice and Bob compare a small test sample, they immediately spot the errors and catch the eavesdropper red-handed!
              </p>
            </div>
          </div>
        </article>

        {/* ── SECTION 2: WHAT DO THE BUTTONS & CONTROLS DO? ── */}
        <article className="glass-card rounded-xl overflow-hidden fade-in-up">
          <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-abyss-700/50 bg-gradient-to-r from-signal-500/[0.04] to-transparent">
            <div className="grid size-9 place-items-center rounded-lg bg-signal-500/10 border border-signal-500/20 text-signal-400">
              <Sliders className="size-4.5" aria-hidden />
            </div>
            <div>
              <span className="font-mono text-[10.5px] font-semibold tracking-wider text-signal-400/80 uppercase">Part 02</span>
              <h2 className="text-base font-bold text-ink-100 tracking-tight">
                Workbench Controls Guide: What Every Slider &amp; Button Does
              </h2>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <p className="text-[13.5px] text-ink-300 mb-6">
              When using the left control panel on the main page, here is what each input actually configures in the backend simulation:
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Photon Count */}
              <div className="rounded-xl border border-abyss-700/50 bg-abyss-850/40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13.5px] font-bold text-signal-300">1. Photon Count (n_photons)</span>
                  <span className="font-mono text-[11px] text-ink-500">8 to 4096</span>
                </div>
                <p className="text-[12.5px] leading-relaxed text-ink-300">
                  The total number of single-photon light pulses Alice fires down the fiber.
                </p>
                <div className="mt-2 text-[11.5px] text-ink-400 bg-abyss-900/60 p-2.5 rounded-lg border border-abyss-800">
                  <strong className="text-ink-200">Why change it:</strong> More photons produce a longer, richer secret key and cleaner statistical accuracy. Default is 256 photons.
                </div>
              </div>

              {/* Test Sample Fraction */}
              <div className="rounded-xl border border-abyss-700/50 bg-abyss-850/40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13.5px] font-bold text-signal-300">2. Test Sample Fraction</span>
                  <span className="font-mono text-[11px] text-ink-500">0% to 100%</span>
                </div>
                <p className="text-[12.5px] leading-relaxed text-ink-300">
                  The percentage of matching bits Alice and Bob publicly reveal over the phone to check if an intruder listened in.
                </p>
                <div className="mt-2 text-[11.5px] text-ink-400 bg-abyss-900/60 p-2.5 rounded-lg border border-abyss-800">
                  <strong className="text-ink-200">Why change it:</strong> If you test 25%, you sacrifice 1/4 of your bits to check for errors, keeping the remaining 75% secret.
                </div>
              </div>

              {/* Abort Threshold QBER */}
              <div className="rounded-xl border border-abyss-700/50 bg-abyss-850/40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13.5px] font-bold text-signal-300">3. Abort Threshold (QBER)</span>
                  <span className="font-mono text-[11px] text-ink-500">Default ~11%</span>
                </div>
                <p className="text-[12.5px] leading-relaxed text-ink-300">
                  The security tripwire alarm! QBER stands for <em>Quantum Bit Error Rate</em> (the percentage of test bits that don't match).
                </p>
                <div className="mt-2 text-[11.5px] text-ink-400 bg-abyss-900/60 p-2.5 rounded-lg border border-abyss-800">
                  <strong className="text-ink-200">Why change it:</strong> If the measured error rate exceeds this number, the system concludes an eavesdropper is on the line and aborts!
                </div>
              </div>

              {/* Channel Noise */}
              <div className="rounded-xl border border-abyss-700/50 bg-abyss-850/40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13.5px] font-bold text-signal-300">4. Channel Noise</span>
                  <span className="font-mono text-[11px] text-ink-500">0% to 50%</span>
                </div>
                <p className="text-[12.5px] leading-relaxed text-ink-300">
                  Simulates natural physical imperfections in real optical fiber (e.g. thermal noise, fiber bending, detector dark counts).
                </p>
                <div className="mt-2 text-[11.5px] text-ink-400 bg-abyss-900/60 p-2.5 rounded-lg border border-abyss-800">
                  <strong className="text-ink-200">Why change it:</strong> Shows how natural noise adds background errors independent of an active eavesdropper.
                </div>
              </div>

              {/* Eavesdropper (Eve) Toggle */}
              <div className="rounded-xl border border-abyss-700/50 bg-abyss-850/40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13.5px] font-bold text-eve-400">5. Eavesdropper (Eve) Switch</span>
                  <span className="font-mono text-[11px] text-ink-500">ON / OFF</span>
                </div>
                <p className="text-[12.5px] leading-relaxed text-ink-300">
                  Inserts an eavesdropper into the middle of the fiber optic channel.
                </p>
                <div className="mt-2 text-[11.5px] text-ink-400 bg-abyss-900/60 p-2.5 rounded-lg border border-abyss-800">
                  <strong className="text-ink-200">What happens when ON:</strong> Eve intercepts the photons, measures them with her own guessed filters, and re-transmits new ones.
                </div>
              </div>

              {/* Interception Probability */}
              <div className="rounded-xl border border-abyss-700/50 bg-abyss-850/40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13.5px] font-bold text-eve-400">6. Interception Probability</span>
                  <span className="font-mono text-[11px] text-ink-500">0% to 100%</span>
                </div>
                <p className="text-[12.5px] leading-relaxed text-ink-300">
                  How aggressive Eve is. At 100%, she intercepts every photon. At 30%, she only taps 3 out of every 10 photons.
                </p>
                <div className="mt-2 text-[11.5px] text-ink-400 bg-abyss-900/60 p-2.5 rounded-lg border border-abyss-800">
                  <strong className="text-ink-200">Key viva insight:</strong> Full interception pushes errors to ~25%, triggering an instant abort.
                </div>
              </div>

              {/* Plaintext Message */}
              <div className="rounded-xl border border-abyss-700/50 bg-abyss-850/40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13.5px] font-bold text-ink-200">7. Plaintext Message</span>
                  <span className="font-mono text-[11px] text-ink-500">Optional</span>
                </div>
                <p className="text-[12.5px] leading-relaxed text-ink-300">
                  A secret text message (e.g. "MEET AT NOON").
                </p>
                <div className="mt-2 text-[11.5px] text-ink-400 bg-abyss-900/60 p-2.5 rounded-lg border border-abyss-800">
                  <strong className="text-ink-200">What it demonstrates:</strong> If the quantum key passes without intruders, the key encrypts this message using a One-Time Pad (XOR math).
                </div>
              </div>

              {/* Run Button */}
              <div className="rounded-xl border border-signal-500/30 bg-signal-500/[0.04] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13.5px] font-bold text-signal-300">8. "Run Experiment" Button</span>
                  <span className="font-mono text-[11px] text-pass-400">Action</span>
                </div>
                <p className="text-[12.5px] leading-relaxed text-ink-300">
                  Sends your configuration to the Python backend simulation, runs all 7 stages of the protocol, and visualizes the results!
                </p>
              </div>
            </div>
          </div>
        </article>

        {/* ── SECTION 3: STEP-BY-STEP PHYSICS JOURNEY ── */}
        <article className="glass-card rounded-xl overflow-hidden fade-in-up">
          <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-abyss-700/50 bg-gradient-to-r from-signal-500/[0.04] to-transparent">
            <div className="grid size-9 place-items-center rounded-lg bg-signal-500/10 border border-signal-500/20 text-signal-400">
              <Radio className="size-4.5" aria-hidden />
            </div>
            <div>
              <span className="font-mono text-[10.5px] font-semibold tracking-wider text-signal-400/80 uppercase">Part 03</span>
              <h2 className="text-base font-bold text-ink-100 tracking-tight">
                Step-by-Step: The Complete Journey of a Photon
              </h2>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            {/* Step 1 */}
            <div className="flex items-start gap-4">
              <div className="grid size-8 shrink-0 place-items-center rounded-full bg-signal-500/15 border border-signal-500/30 font-mono text-xs font-bold text-signal-300">
                1
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-ink-100">
                  Alice Prepares the Photon (Bit + Polarization Angle)
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-300">
                  Alice wants to send a random bit (0 or 1). She randomly chooses one of two filter frames (called <em>bases</em>):
                </p>
                <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2 text-[12px] font-mono">
                  <div className="rounded-lg border border-alice-500/30 bg-alice-500/10 p-3 text-alice-200">
                    <strong className="text-alice-400">Rectilinear Basis (+):</strong>
                    <div className="mt-1">Bit 0 → Horizontal (0°) |0⟩</div>
                    <div>Bit 1 → Vertical (90°) |1⟩</div>
                  </div>
                  <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3 text-purple-200">
                    <strong className="text-purple-400">Diagonal Basis (×):</strong>
                    <div className="mt-1">Bit 0 → Diagonal 45° |+⟩</div>
                    <div>Bit 1 → Diagonal 135° |−⟩</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4">
              <div className="grid size-8 shrink-0 place-items-center rounded-full bg-eve-500/15 border border-eve-500/30 font-mono text-xs font-bold text-eve-400">
                2
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-ink-100">
                  Eve Intercepts (Why Measuring Ruins the Secret)
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-300">
                  If Eve is listening, she intercepts the photon in mid-air. But Eve has a dilemma: she does not know which filter Alice used (+ or ×)!
                </p>
                <div className="mt-2 text-[12.5px] leading-relaxed text-ink-300 bg-abyss-850/60 p-3.5 rounded-lg border border-abyss-700/60">
                  If Alice sent a 45° photon (Diagonal), and Eve randomly guesses and measures with a Horizontal/Vertical filter (+), <strong className="text-eve-400 font-semibold">quantum mechanics physically forces the photon to randomly collapse into either 0° or 90°</strong>. Eve now re-emits this damaged photon to Bob. The original 45° angle is gone forever!
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-4">
              <div className="grid size-8 shrink-0 place-items-center rounded-full bg-bob-500/15 border border-bob-500/30 font-mono text-xs font-bold text-bob-400">
                3
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-ink-100">
                  Bob Measures with a Random Filter
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-300">
                  Bob also doesn't know Alice's basis yet, so he independently guesses either (+) or (×) for each photon detector.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-4">
              <div className="grid size-8 shrink-0 place-items-center rounded-full bg-signal-500/15 border border-signal-500/30 font-mono text-xs font-bold text-signal-300">
                4
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-ink-100">
                  Sifting: Comparing Bases over a Public Phone Call
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-300">
                  Alice and Bob call each other openly. They <strong>never announce their secret bits</strong>; they only ask:
                </p>
                <p className="mt-1.5 font-mono text-[12px] text-signal-300 bg-abyss-900/60 p-2.5 rounded-lg border border-abyss-800">
                  "For photon #1, what filter did you use?" — "I used (+)." — "I used (+) too! We match, so let's keep it."
                </p>
                <p className="mt-2 text-[13px] text-ink-300">
                  Whenever their filters matched, their bits should be identical. Whenever they used different filters, they discard the photon. About <strong>50% of photons survive sifting</strong>.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="flex items-start gap-4">
              <div className="grid size-8 shrink-0 place-items-center rounded-full bg-warn-400/15 border border-warn-400/30 font-mono text-xs font-bold text-warn-400">
                5
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-ink-100">
                  QBER Check (Parameter Estimation &amp; Security Decision)
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-300">
                  Alice and Bob pick a small test sample of their matching bits (e.g. 25%) and read them aloud over the phone:
                </p>
                <ul className="mt-2 space-y-1.5 text-[12.5px] text-ink-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-pass-400 shrink-0" />
                    <span><strong>No Eve present:</strong> Almost 0% errors. The bits agree. <span className="text-pass-400 font-semibold">PASS!</span></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <XCircle className="size-4 text-eve-400 shrink-0" />
                    <span><strong>Eve was present:</strong> Because Eve's measurement altered the photons, ~25% of matching bits will disagree! Error rate &gt; 11% threshold. <span className="text-eve-400 font-semibold">ABORT! Discard all keys!</span></span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 6 */}
            <div className="flex items-start gap-4">
              <div className="grid size-8 shrink-0 place-items-center rounded-full bg-pass-400/15 border border-pass-400/30 font-mono text-xs font-bold text-pass-400">
                6
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-ink-100">
                  Retained Key &amp; One-Time Pad Encryption
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-300">
                  The bits publicly announced in Step 5 are discarded (since Eve heard them). The <strong>remaining untouched bits become the final shared secret key</strong>. Alice uses this key to encrypt her secret message with XOR mathematics (One-Time Pad), and Bob decrypts it perfectly.
                </p>
              </div>
            </div>
          </div>
        </article>

        {/* ── SECTION 4: HOW TO EXPLAIN THIS IN YOUR VIVA ── */}
        <article className="glass-card rounded-xl overflow-hidden fade-in-up border-signal-500/30">
          <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-abyss-700/50 bg-gradient-to-r from-signal-500/[0.08] to-transparent">
            <div className="grid size-9 place-items-center rounded-lg bg-signal-500/15 border border-signal-500/30 text-signal-400">
              <HelpCircle className="size-4.5" aria-hidden />
            </div>
            <div>
              <span className="font-mono text-[10.5px] font-semibold tracking-wider text-signal-400 uppercase">Viva Checklist</span>
              <h2 className="text-base font-bold text-ink-100 tracking-tight">
                Top Questions Your Examiner / Professor Might Ask
              </h2>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-4 text-[13px] leading-relaxed text-ink-300">
            <div className="rounded-lg border border-abyss-700/40 bg-abyss-850/40 p-4">
              <h4 className="font-bold text-ink-100">Q1: "Does BB84 transmit the encrypted secret message through the quantum channel?"</h4>
              <p className="mt-1 text-ink-300">
                <strong className="text-signal-300">Answer:</strong> No! BB84 is a <em>Key Distribution</em> protocol. It only produces a random shared secret key between Alice and Bob. The actual message encryption happens afterwards over standard classical channels using a One-Time Pad.
              </p>
            </div>

            <div className="rounded-lg border border-abyss-700/40 bg-abyss-850/40 p-4">
              <h4 className="font-bold text-ink-100">Q2: "Why can't Eve just copy the photon without measuring it?"</h4>
              <p className="mt-1 text-ink-300">
                <strong className="text-signal-300">Answer:</strong> The <em>No-Cloning Theorem</em> (Wootters &amp; Zurek, 1982) mathematically proves that it is impossible to create an identical copy of an arbitrary unknown quantum state. Eve must measure, and measuring collapses the state.
              </p>
            </div>

            <div className="rounded-lg border border-abyss-700/40 bg-abyss-850/40 p-4">
              <h4 className="font-bold text-ink-100">Q3: "Why is the expected error rate 25% when Eve intercepts 100%?"</h4>
              <p className="mt-1 text-ink-300">
                <strong className="text-signal-300">Answer:</strong> Eve guesses the wrong basis 50% of the time. When she guesses wrong and resends a distorted photon, Bob has a 50% chance of getting the wrong bit. 50% × 50% = <strong>25% expected error rate</strong> in the sifted bits!
              </p>
            </div>

            <div className="rounded-lg border border-abyss-700/40 bg-abyss-850/40 p-4">
              <h4 className="font-bold text-ink-100">Q4: "Why ~11% threshold?"</h4>
              <p className="mt-1 text-ink-300">
                <strong className="text-signal-300">Answer:</strong> In the Shor–Preskill security proof, 11% is the theoretical maximum tolerable error rate where Alice and Bob can still extract an error-free secret key using classical error correction and privacy amplification.
              </p>
            </div>
          </div>
        </article>

        {/* Bottom CTA */}
        <div className="text-center pt-4 pb-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-signal-500 to-signal-600 px-7 py-3.5 text-sm font-bold text-abyss-950 shadow-lg transition-all hover:shadow-signal-500/25 hover:from-signal-400 hover:to-signal-500"
          >
            <BookOpen className="size-4" aria-hidden />
            Return to Workbench &amp; Try Experiment
          </Link>
        </div>
      </div>
    </main>
  )
}
