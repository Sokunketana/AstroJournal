import { Sparkles } from 'lucide-react';
import Logo from '../Logo';

const LoadingScreen = () => (
  <main
    className="loading-screen relative flex min-h-screen overflow-hidden bg-[#03040a] text-white"
    role="status"
    aria-live="polite"
    aria-label="Preparing your AstroJournal"
  >
    <div className="loading-aurora loading-aurora-left" aria-hidden="true" />
    <div className="loading-aurora loading-aurora-right" aria-hidden="true" />
    <div className="loading-star-field absolute inset-0" aria-hidden="true" />

    <div className="relative z-10 flex min-h-screen w-full flex-col px-6 py-7 sm:px-10 sm:py-9">
      <div className="loading-brand flex items-center self-start">
        <Logo className="text-sm tracking-[0.16em] sm:text-base" />
      </div>

      <section className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center pb-10 text-center sm:pb-14">
        <div className="loading-celestial mb-10" aria-hidden="true">
          <div className="loading-orbit loading-orbit-outer">
            <span className="loading-orbit-star loading-orbit-star-gold" />
          </div>
          <div className="loading-orbit loading-orbit-middle">
            <span className="loading-orbit-star loading-orbit-star-violet" />
          </div>
          <div className="loading-orbit loading-orbit-inner">
            <span className="loading-orbit-star loading-orbit-star-white" />
          </div>
          <div className="loading-core">
            <span className="loading-core-halo" />
            <Sparkles size={30} strokeWidth={1.35} className="relative text-[#f6d98f]" />
          </div>
          <span className="loading-distant-star loading-distant-star-one" />
          <span className="loading-distant-star loading-distant-star-two" />
          <span className="loading-distant-star loading-distant-star-three" />
        </div>

        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.34em] text-[#efd392] sm:text-xs">
          Your universe is taking shape
        </p>
        <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
          Preparing your night sky
        </h2>
        <p className="mt-4 max-w-md text-sm leading-6 text-white/45 sm:text-base">
          Gathering your reflections and placing every memory among the stars.
        </p>

        <div className="mt-8 flex items-center gap-2" aria-hidden="true">
          <span className="loading-progress-dot" />
          <span className="loading-progress-dot loading-progress-dot-delay-one" />
          <span className="loading-progress-dot loading-progress-dot-delay-two" />
        </div>
      </section>

      <p className="text-center text-[10px] font-medium uppercase tracking-[0.24em] text-white/25 sm:text-xs">
        A quiet moment before the stars appear
      </p>
    </div>
  </main>
);

export default LoadingScreen;
