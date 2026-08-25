import type { ReactNode } from 'react';
import Logo from '../Logo';

interface AuthShellProps {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
}

const AuthShell = ({ children, eyebrow, title, description }: AuthShellProps) => (
  <div className="auth-screen relative min-h-screen overflow-hidden bg-[#03040a] text-white">
    <div className="loading-aurora loading-aurora-left" aria-hidden="true" />
    <div className="loading-aurora loading-aurora-right" aria-hidden="true" />
    <div className="loading-star-field absolute inset-0" aria-hidden="true" />
    <div className="auth-grid absolute inset-0" aria-hidden="true" />

    <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[90rem] flex-col px-5 py-6 sm:px-8 lg:px-12 lg:py-8">
      <header className="auth-enter flex items-center justify-between">
        <a href="/" className="group flex items-center" aria-label="AstroJournal home">
          <Logo className="text-sm tracking-[0.16em] sm:text-base" />
        </a>

        <div className="hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35 sm:flex">
          <span className="h-1 w-1 rounded-full bg-[#efd392] shadow-[0_0_7px_#efd392]" />
          Your private night sky
        </div>
      </header>

      <main className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-20 lg:py-8 xl:gap-28">
        <section className="auth-enter auth-enter-copy relative mx-auto flex max-w-2xl flex-col items-center text-center lg:justify-self-center lg:items-start lg:text-left">
          <div className="auth-constellation mb-8" aria-hidden="true">
            <svg viewBox="0 0 210 118" fill="none" role="presentation">
              <path className="auth-constellation-line" d="M18 77 57 39l43 25 38-43 54 34-31 43-61-34-42 30-40-17Z" />
              <path className="auth-constellation-line auth-constellation-line-delay" d="m57 39 1 55m42-30 61 34m-23-77 23 77" />
              <g className="auth-constellation-stars">
                <circle cx="18" cy="77" r="2.6" />
                <circle cx="57" cy="39" r="3.2" />
                <circle cx="58" cy="94" r="2.1" />
                <circle cx="100" cy="64" r="3.8" className="auth-constellation-star-gold" />
                <circle cx="138" cy="21" r="2.5" />
                <circle cx="161" cy="98" r="3" />
                <circle cx="192" cy="55" r="2.2" className="auth-constellation-star-gold" />
              </g>
            </svg>
            <span className="auth-constellation-label">A story, connected</span>
          </div>

          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.34em] text-[#efd392] sm:text-xs">
            {eyebrow}
          </p>
          <h1 className="max-w-xl text-4xl font-semibold leading-[1.05] tracking-[-0.05em] text-white sm:text-5xl xl:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-6 text-white/45 sm:text-base sm:leading-7">
            {description}
          </p>

          <div className="mt-8 hidden items-center gap-5 text-[11px] font-medium uppercase tracking-[0.18em] text-white/30 sm:flex">
            <span>Reflect</span>
            <span className="h-px w-8 bg-gradient-to-r from-[#efd392]/50 to-transparent" />
            <span>Connect</span>
            <span className="h-px w-8 bg-gradient-to-r from-[#b8a8ff]/50 to-transparent" />
            <span>Remember</span>
          </div>
        </section>

        <section className="auth-enter auth-enter-card mx-auto w-full max-w-[440px]" aria-label="Account access">
          <div className="relative">
            {children}
          </div>
          <p className="mt-5 text-center text-[10px] font-medium uppercase tracking-[0.2em] text-white/20">
            A quiet place for everything on your mind
          </p>
        </section>
      </main>
    </div>
  </div>
);

export default AuthShell;
