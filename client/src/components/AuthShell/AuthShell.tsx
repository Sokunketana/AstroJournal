import type { ReactNode } from 'react';
import Logo from '../Logo';

interface AuthShellProps {
  children: ReactNode;
  subtitle: string;
}

const AuthShell = ({ children, subtitle }: AuthShellProps) => (
  <div className="relative min-h-screen overflow-hidden bg-[#03040a] px-4 py-10 text-white">
    <div
      className="pointer-events-none absolute inset-0 opacity-50"
      style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.16) 0.65px, transparent 0.65px)',
        backgroundSize: '30px 30px',
        maskImage: 'linear-gradient(to bottom, black, transparent 78%)',
      }}
      aria-hidden="true"
    />
    <div
      className="pointer-events-none absolute left-1/2 top-[-18rem] h-[34rem] w-[52rem] -translate-x-1/2 rounded-full bg-violet-700/15 blur-[120px]"
      aria-hidden="true"
    />
    <div
      className="pointer-events-none absolute bottom-[-20rem] right-[-12rem] h-[34rem] w-[34rem] rounded-full bg-amber-500/10 blur-[130px]"
      aria-hidden="true"
    />

    <main className="relative z-10 flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center gap-8">
      <div className="text-center">
        <div className="mb-3 inline-flex items-center rounded-full border border-amber-200/10 bg-amber-100/[0.035] px-5 py-2 shadow-[0_0_40px_rgba(245,188,91,0.06)]">
          <Logo className="text-3xl" />
        </div>
        <p className="text-sm tracking-wide text-[#959bad]">{subtitle}</p>
      </div>
      {children}
    </main>
  </div>
);

export default AuthShell;
