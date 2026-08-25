import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useAuth } from '@clerk/react';
import { Link, useNavigate } from '@tanstack/react-router';
import {
  ArrowRight,
  BookOpenText,
  Brain,
  CalendarDays,
  Flame,
  LockKeyhole,
  Orbit,
  Rocket,
  Search,
  Share2,
  Sparkles,
  Star,
} from 'lucide-react';
import Logo from '../../components/Logo';
import LoadingScreen from '../../components/LoadingScreen';

const previewStars = [
  { left: '14%', top: '28%', size: 3, glow: '#f8d899' },
  { left: '27%', top: '54%', size: 5, glow: '#b8a8ff' },
  { left: '43%', top: '20%', size: 3, glow: '#ffffff' },
  { left: '55%', top: '46%', size: 7, glow: '#ffd275' },
  { left: '72%', top: '27%', size: 4, glow: '#b7d8ff' },
  { left: '84%', top: '57%', size: 3, glow: '#ffffff' },
  { left: '38%', top: '72%', size: 4, glow: '#ffad8a' },
  { left: '68%', top: '77%', size: 5, glow: '#d5c6ff' },
];

const steps = [
  {
    number: '01',
    icon: BookOpenText,
    title: 'Capture an honest moment',
    copy: 'Write whenever something feels worth keeping. Every reflection adds another meaningful point to your sky.',
  },
  {
    number: '02',
    icon: Rocket,
    title: 'Launch it into your sky',
    copy: 'Your reflection becomes a star, colored by the feeling behind your words and placed in your universe.',
  },
  {
    number: '03',
    icon: Share2,
    title: 'Connect the chapters',
    copy: 'Gather meaningful stars into constellations that reveal the seasons and stories shaping your life.',
  },
];

const emotionStars = [
  { label: 'Joy', color: '#f6cf72', left: '11%', top: '58%' },
  { label: 'Calm', color: '#8fc8ff', left: '30%', top: '30%' },
  { label: 'Hope', color: '#bba5ff', left: '52%', top: '52%' },
  { label: 'Tender', color: '#ff9f9f', left: '73%', top: '25%' },
  { label: 'Proud', color: '#f2dfb2', left: '88%', top: '62%' },
];

interface ConstellationPoint {
  x: number;
  y: number;
}

interface ConstellationSegment {
  from: ConstellationPoint;
  to: ConstellationPoint;
  fromColor: string;
  toColor: string;
}

const revealCallbacks = new Map<Element, () => void>();
let revealObserver: IntersectionObserver | null = null;

const getRevealObserver = () => {
  if (typeof IntersectionObserver === 'undefined') return null;

  if (!revealObserver) {
    revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          revealCallbacks.get(entry.target)?.();
          revealCallbacks.delete(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: '0px 0px -6% 0px' },
    );
  }

  return revealObserver;
};

const Reveal = ({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = getRevealObserver();
    if (!observer) {
      const timer = window.setTimeout(() => setIsVisible(true), 0);
      return () => window.clearTimeout(timer);
    }

    revealCallbacks.set(element, () => setIsVisible(true));
    observer.observe(element);
    return () => {
      revealCallbacks.delete(element);
      observer.unobserve(element);
    };
  }, []);

  return (
    <div
      ref={elementRef}
      className={`landing-reveal ${className}`}
      data-visible={isVisible}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
};

const ConstellationConnections = ({ segments }: { segments: ConstellationSegment[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      const bounds = container.getBoundingClientRect();
      setSize({ width: bounds.width, height: bounds.height });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0" aria-hidden="true">
      {size.width > 0 && segments.map((segment, index) => {
        const deltaX = ((segment.to.x - segment.from.x) / 100) * size.width;
        const deltaY = ((segment.to.y - segment.from.y) / 100) * size.height;
        const length = Math.hypot(deltaX, deltaY);
        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

        return (
          <span
            key={index}
            className="absolute h-px origin-left"
            style={{
              left: `${segment.from.x}%`,
              top: `${segment.from.y}%`,
              width: length,
              transform: `rotate(${angle}deg)`,
            }}
          >
            <span
              className="landing-line-draw block h-full w-full origin-left"
              style={{
                background: `linear-gradient(90deg, ${segment.fromColor}, ${segment.toColor})`,
                boxShadow: `0 0 6px ${segment.fromColor}22`,
                animationDelay: `${300 + index * 220}ms`,
              }}
            />
          </span>
        );
      })}
    </div>
  );
};

const previewSegments: ConstellationSegment[] = [
  {
    from: { x: 27, y: 54 },
    to: { x: 55, y: 46 },
    fromColor: 'rgba(184, 168, 255, 0.7)',
    toColor: 'rgba(255, 210, 117, 0.7)',
  },
  {
    from: { x: 55, y: 46 },
    to: { x: 84, y: 57 },
    fromColor: 'rgba(255, 210, 117, 0.7)',
    toColor: 'rgba(183, 216, 255, 0.55)',
  },
];

const featureSegments: ConstellationSegment[] = emotionStars.slice(0, -1).map((star, index) => ({
  from: { x: Number.parseFloat(star.left), y: Number.parseFloat(star.top) },
  to: {
    x: Number.parseFloat(emotionStars[index + 1].left),
    y: Number.parseFloat(emotionStars[index + 1].top),
  },
  fromColor: `${star.color}aa`,
  toColor: `${emotionStars[index + 1].color}99`,
}));

const METEOR_INTRO_KEY = 'astrojournal-meteor-intro-seen';
const METEOR_INTRO_DURATION = 2900;

const meteorParticles = [
  { x: '-13rem', y: '-3rem', delay: '0ms' },
  { x: '-10rem', y: '7rem', delay: '35ms' },
  { x: '-4rem', y: '-11rem', delay: '70ms' },
  { x: '1rem', y: '12rem', delay: '20ms' },
  { x: '9rem', y: '-8rem', delay: '55ms' },
  { x: '14rem', y: '2rem', delay: '90ms' },
  { x: '7rem', y: '10rem', delay: '110ms' },
  { x: '-8rem', y: '-8rem', delay: '125ms' },
];

const meteorCracks = [
  { angle: '-168deg', length: '31vmin', delay: '0ms', branch: '-32deg' },
  { angle: '-132deg', length: '38vmin', delay: '50ms', branch: '38deg' },
  { angle: '-94deg', length: '28vmin', delay: '95ms', branch: '-42deg' },
  { angle: '-48deg', length: '39vmin', delay: '25ms', branch: '31deg' },
  { angle: '-12deg', length: '34vmin', delay: '80ms', branch: '-36deg' },
  { angle: '32deg', length: '35vmin', delay: '120ms', branch: '40deg' },
  { angle: '73deg', length: '29vmin', delay: '65ms', branch: '-34deg' },
  { angle: '116deg', length: '37vmin', delay: '110ms', branch: '36deg' },
  { angle: '151deg', length: '30vmin', delay: '145ms', branch: '-39deg' },
];

const shouldPlayMeteorIntro = () => {
  if (typeof window === 'undefined') return false;

  try {
    const replayRequested = new URLSearchParams(window.location.search).get('meteor') === '1';
    return (
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      && (replayRequested || window.sessionStorage.getItem(METEOR_INTRO_KEY) !== 'true')
    );
  } catch {
    return true;
  }
};

const MeteorIntro = () => (
  <div className="meteor-intro" aria-hidden="true">
    <div className="meteor-intro-stage">
      <div className="meteor-intro-space">
        <div className="meteor-intro-stars" />
      </div>

      <div className="meteor-intro-shards">
        {Array.from({ length: 8 }, (_, index) => (
          <span key={index} className={`meteor-intro-shard meteor-intro-shard-${index + 1}`} />
        ))}
      </div>

      <div className="meteor-intro-ambient" />

      <div className="meteor-intro-body">
        <span className="meteor-intro-tail" />
        <span className="meteor-intro-fire" />
        <span className="meteor-intro-core">
          <span className="meteor-intro-crater meteor-intro-crater-one" />
          <span className="meteor-intro-crater meteor-intro-crater-two" />
          <span className="meteor-intro-crater meteor-intro-crater-three" />
        </span>
      </div>

      <div className="meteor-intro-impact">
        <span className="meteor-intro-flash" />
        <span className="meteor-intro-ring meteor-intro-ring-one" />
        <span className="meteor-intro-ring meteor-intro-ring-two" />
        <span className="meteor-intro-impact-star" />
        {meteorParticles.map((particle, index) => (
          <span
            key={index}
            className="meteor-intro-particle"
            style={{
              '--meteor-particle-x': particle.x,
              '--meteor-particle-y': particle.y,
              '--meteor-particle-delay': particle.delay,
            } as CSSProperties}
          />
        ))}
      </div>

      <div className="meteor-intro-cracks">
        {meteorCracks.map((crack, index) => (
          <span
            key={index}
            className="meteor-intro-crack"
            style={{
              '--meteor-crack-angle': crack.angle,
              '--meteor-crack-length': crack.length,
              '--meteor-crack-delay': crack.delay,
              '--meteor-branch-angle': crack.branch,
            } as CSSProperties}
          >
            <span />
          </span>
        ))}
      </div>
    </div>

    <p className="meteor-intro-copy">Impact becomes memory</p>
  </div>
);

const LandingPage = () => {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const primaryTo = isSignedIn ? '/app' : '/sign-up';
  const [showMeteorIntro, setShowMeteorIntro] = useState(shouldPlayMeteorIntro);

  useEffect(() => {
    if (isSignedIn) {
      void navigate({ to: '/app', replace: true });
    }
  }, [isSignedIn, navigate]);

  useEffect(() => {
    if (!showMeteorIntro) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    try {
      window.sessionStorage.setItem(METEOR_INTRO_KEY, 'true');
    } catch {
      // The intro still works when session storage is unavailable.
    }

    const timer = window.setTimeout(() => setShowMeteorIntro(false), METEOR_INTRO_DURATION);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, [showMeteorIntro]);

  if (isSignedIn) {
    return <LoadingScreen />;
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#03040a] text-[#f8f5ed]">
      {showMeteorIntro && <MeteorIntro />}
      <section className="landing-hero relative isolate min-h-screen border-b border-white/[0.06]">
        <div className="landing-stars pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="landing-glow landing-glow-violet pointer-events-none absolute -left-28 top-12 h-[34rem] w-[34rem] rounded-full" aria-hidden="true" />
        <div className="landing-glow landing-glow-amber pointer-events-none absolute -right-32 top-[16%] h-[40rem] w-[40rem] rounded-full" aria-hidden="true" />
        <div className="landing-shooting-star landing-shooting-star-one" aria-hidden="true" />
        <div className="landing-shooting-star landing-shooting-star-two" aria-hidden="true" />

        <nav className="landing-enter relative z-30 mx-auto flex w-full max-w-[90rem] items-center justify-between gap-3 px-5 py-6 sm:px-8 lg:px-12">
          <Link to="/" aria-label="AstroJournal home">
            <Logo className="text-base min-[380px]:text-lg sm:text-2xl" />
          </Link>
          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            <div className="mr-3 hidden items-center gap-7 text-sm text-white/50 lg:flex">
              <a href="#why" className="transition hover:text-white">Why AstroJournal</a>
              <a href="#how-it-works" className="transition hover:text-white">How it works</a>
              <a href="#features" className="transition hover:text-white">Inside your sky</a>
            </div>
            {!isSignedIn && (
              <Link
                to="/login"
                className="whitespace-nowrap rounded-full px-2 py-2 text-xs font-medium text-white/65 transition hover:text-white sm:px-4 sm:text-sm"
              >
                Sign in
              </Link>
            )}
            <Link
              to={primaryTo}
              className="group inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#f6d487]/30 bg-[#f4d18a] px-3 py-2 text-xs font-black text-[#09080d] shadow-[0_0_24px_rgba(244,209,138,0.14)] transition hover:bg-[#ffe5a9] sm:gap-2 sm:px-5 sm:text-sm"
            >
              <span className="sm:hidden">{isSignedIn ? 'Open' : 'Start'}</span>
              <span className="hidden sm:inline">{isSignedIn ? 'Open your sky' : 'Start journaling'}</span>
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5 sm:h-[15px] sm:w-[15px]" />
            </Link>
          </div>
        </nav>

        <div className="relative z-10 mx-auto grid min-h-[calc(100vh-88px)] w-full max-w-[90rem] items-center gap-16 px-5 pb-16 pt-10 sm:px-8 lg:grid-cols-[0.88fr_1.12fr] lg:px-12 lg:pb-20 lg:pt-4 xl:gap-24">
          <div className="min-w-0 max-w-[44rem]">
            <div className="landing-enter landing-enter-delay-1 mb-7 inline-flex items-center gap-2 rounded-full border border-[#f2d18b]/20 bg-[#f2d18b]/[0.06] px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#f2d18b] sm:text-[11px]">
              <span className="landing-live-dot h-1.5 w-1.5 rounded-full bg-[#f2d18b]" />
              Your life is already a story
            </div>
            <h1 className="landing-enter landing-enter-delay-2 text-balance text-[3.45rem] font-black leading-[0.88] tracking-[-0.07em] sm:text-[5rem] lg:text-[5.65rem] xl:text-[6.5rem]">
              Don’t let today
              <span className="landing-memory-word relative mt-2 block w-fit text-[#f5d99e]">
                disappear.
              </span>
            </h1>
            <p className="landing-enter landing-enter-delay-3 mt-8 max-w-[38rem] text-pretty text-base leading-7 text-[#a5a9b8] sm:text-lg sm:leading-8">
              AstroJournal turns the moments you write down into a living night sky — one entry, one star, one unforgettable chapter at a time.
            </p>
            <div className="landing-enter landing-enter-delay-4 mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to={primaryTo}
                className="landing-primary-cta group inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-[#f5d99e] px-7 py-4 text-sm font-black text-[#09080d] shadow-[0_0_48px_rgba(245,217,158,0.16)] transition hover:-translate-y-0.5 hover:bg-[#ffe7b3]"
              >
                {isSignedIn ? 'Return to your universe' : 'Remember tonight'}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#why"
                className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.025] px-5 py-4 text-sm font-bold text-white/65 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
              >
                Discover the idea
                <span className="transition-transform group-hover:translate-y-0.5" aria-hidden="true">↓</span>
              </a>
            </div>
            <div className="landing-enter landing-enter-delay-5 mt-9 flex flex-wrap gap-x-6 gap-y-3 text-[11px] font-semibold text-white/40 sm:text-xs">
              <span className="inline-flex items-center gap-2"><LockKeyhole size={13} className="text-emerald-200/60" /> Private by design</span>
              <span className="inline-flex items-center gap-2"><BookOpenText size={13} className="text-[#e8c87c]" /> One honest sentence is enough</span>
            </div>
          </div>

          <div className="landing-enter landing-enter-product landing-enter-delay-3 relative mx-auto w-full max-w-[46rem] lg:mx-0">
            <div className="landing-glow landing-glow-violet-soft absolute -inset-14 rounded-full" aria-hidden="true" />
            <div className="landing-sky-window relative rotate-[1.25deg] overflow-hidden rounded-[2.2rem] border border-white/[0.12] bg-[#070912]/95 p-3 shadow-[0_42px_120px_rgba(0,0,0,0.64)] transition duration-700 hover:rotate-0 sm:p-4">
              <div className="flex items-center justify-between px-3 pb-3 pt-1 text-[9px] font-black uppercase tracking-[0.2em] text-white/35 sm:text-[10px]">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.75)]" />
                  Your sky · live
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-orange-300/70"><Flame size={12} /> 12 day streak</span>
                  <span className="hidden items-center gap-1 text-amber-200/70 sm:inline-flex"><Star size={12} /> 48 memories</span>
                </div>
              </div>
              <div className="relative aspect-[1.22/0.86] min-h-[330px] overflow-hidden rounded-[1.55rem] border border-white/[0.07] bg-[radial-gradient(circle_at_52%_118%,#392458_0%,#101225_35%,#04050b_75%)] sm:min-h-[440px]">
                <div className="landing-preview-grid absolute inset-0 opacity-25" aria-hidden="true" />
                <div className="landing-orbit-ring landing-orbit-ring-one" aria-hidden="true" />
                <div className="landing-orbit-ring landing-orbit-ring-two" aria-hidden="true" />
                <ConstellationConnections segments={previewSegments} />
                {previewStars.map((star, index) => (
                  <span
                    key={index}
                    className="landing-preview-star landing-twinkle absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      left: star.left,
                      top: star.top,
                      width: star.size,
                      height: star.size,
                      background: star.glow,
                      boxShadow: `0 0 ${star.size * 3}px ${star.glow}`,
                      animationDelay: `${700 + index * 240}ms`,
                      animationDuration: `${2.8 + (index % 3) * 0.65}s`,
                    }}
                  />
                ))}
                <div className="landing-memory-card absolute left-[8%] top-[12%] max-w-[11rem] rounded-2xl border border-white/10 bg-[#0b0d18]/95 px-3.5 py-3 text-left shadow-2xl sm:max-w-[14rem] sm:px-4">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#a89cf6]">May 06 · hope</p>
                  <p className="mt-1.5 text-[11px] leading-5 text-white/70 sm:text-xs">“I said yes before I could talk myself out of it.”</p>
                </div>
                <div className="landing-memory-card absolute right-[5%] top-[46%] max-w-[11.5rem] rounded-2xl border border-[#f2d18b]/15 bg-[#0b0d18]/95 px-3.5 py-3 text-left shadow-2xl sm:max-w-[15rem] sm:px-4">
                  <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#f2d18b]">Tonight · calm</p>
                  <p className="mt-1.5 text-[11px] leading-5 text-white/75 sm:text-xs">“The quiet walk home was the best part of my day.”</p>
                </div>
                <div className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-[#171923]/95 p-2 pl-4 shadow-[0_18px_50px_rgba(0,0,0,0.35)] sm:inset-x-6 sm:bottom-6 sm:p-2.5 sm:pl-5">
                  <span className="flex-1 text-xs text-white/40 sm:text-sm">What felt worth remembering today?</span>
                  <span className="landing-rocket-idle flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f5d99e] text-black shadow-[0_0_24px_rgba(245,217,158,0.25)]">
                    <Rocket size={17} className="-rotate-45" />
                  </span>
                </div>
              </div>
            </div>
            <div className="landing-float-chip absolute -bottom-5 -left-1 rounded-2xl border border-white/10 bg-[#0c0e17]/95 px-4 py-3 shadow-2xl sm:-left-8">
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30">A chapter taking shape</p>
              <p className="mt-1 text-xs font-bold text-[#e7ddff] sm:text-sm">Finding my orbit · 7 stars</p>
            </div>
            <div className="landing-float-chip absolute -right-2 top-20 hidden rounded-2xl border border-white/10 bg-[#0c0e17]/95 px-4 py-3 shadow-2xl sm:block lg:-right-6">
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30">This month</p>
              <p className="mt-1 inline-flex items-center gap-2 text-sm font-bold text-[#f5d99e]"><Sparkles size={13} /> 14 moments kept</p>
            </div>
          </div>
        </div>
      </section>

      <section id="why" className="landing-deferred-section relative border-b border-white/[0.06] px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
        <div className="landing-stars pointer-events-none absolute inset-0 opacity-20" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl">
          <Reveal className="grid items-end gap-8 lg:grid-cols-[1.35fr_0.65fr] lg:gap-20">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#a89cf6]">Why AstroJournal exists</p>
              <h2 className="mt-6 text-balance text-4xl font-black leading-[1.02] tracking-[-0.05em] sm:text-6xl lg:text-7xl">
                Most days blur.<br />The ones you write down become <span className="text-[#f2d18b]">coordinates.</span>
              </h2>
            </div>
            <p className="max-w-xl text-base leading-8 text-[#999eae] lg:pb-2">
              This isn’t another blank page asking for a perfect essay. AstroJournal gives every small reflection a place in the bigger picture, so your memories feel connected instead of buried.
            </p>
          </Reveal>

          <div className="mt-16 grid overflow-hidden rounded-[2rem] border border-white/[0.08] bg-white/[0.025] md:grid-cols-3">
            {[
              ['01', 'Notice', 'Pause long enough to name one thing that mattered.'],
              ['02', 'Remember', 'Watch that moment become a star you can return to.'],
              ['03', 'Understand', 'Connect the stars and see the story you are living.'],
            ].map(([number, title, copy], index) => (
              <Reveal key={number} delay={index * 100} className="h-full">
                <article className="group relative h-full border-b border-white/[0.07] p-7 transition duration-500 hover:bg-white/[0.035] last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 sm:p-9">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black tracking-[0.25em] text-white/25">{number}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-[#f2d18b] opacity-40 shadow-[0_0_12px_#f2d18b] transition group-hover:opacity-100" />
                  </div>
                  <h3 className="mt-12 text-2xl font-black tracking-tight">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#858b9d]">{copy}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="landing-deferred-section relative border-b border-white/[0.06] px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
        <div className="landing-glow landing-glow-violet-soft pointer-events-none absolute left-1/2 top-1/3 h-80 w-[60%] -translate-x-1/2 rounded-full" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d7bb80]">A quieter daily ritual</p>
            <h2 className="mt-5 text-balance text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              Three small steps. A universe of perspective.
            </h2>
            <p className="mt-5 text-base leading-7 text-[#9095a7]">
              AstroJournal turns reflection into something you can see, revisit, and feel growing around you.
            </p>
          </Reveal>

          <div className="relative mt-16 grid gap-4 lg:grid-cols-3">
            <div className="pointer-events-none absolute left-[17%] right-[17%] top-12 hidden h-px bg-gradient-to-r from-transparent via-white/15 to-transparent lg:block" aria-hidden="true" />
            {steps.map(({ number, icon: Icon, title, copy }, index) => (
              <Reveal key={number} delay={index * 110} className="h-full">
              <article className="group relative h-full rounded-[1.75rem] border border-white/[0.08] bg-white/[0.025] p-7 transition duration-500 hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.045] sm:p-8">
                <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#0d0f19] text-[#e9d6ad] shadow-[0_0_30px_rgba(225,198,142,0.06)]">
                  <Icon size={21} />
                </div>
                <p className="mt-10 text-[10px] font-black tracking-[0.25em] text-white/25">ORBIT {number}</p>
                <h3 className="mt-3 text-xl font-bold tracking-tight text-white/90">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#858b9d]">{copy}</p>
              </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="landing-deferred-section relative px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-14 lg:grid-cols-[0.82fr_1.18fr] lg:gap-24">
            <Reveal>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#b8a6ff]">Your life, in orbit</p>
              <h2 className="mt-5 text-balance text-4xl font-black tracking-[-0.045em] sm:text-5xl lg:text-6xl">
                Your days stop disappearing.
              </h2>
              <p className="mt-6 max-w-lg text-base leading-7 text-[#9297a8] sm:text-lg sm:leading-8">
                Instead of another endless list of dated entries, you get a sky that remembers with you. Zoom out to see your growth. Move closer to rediscover the moment behind any star.
              </p>
              <div className="mt-8 space-y-4 text-sm text-white/65">
                <p className="flex items-center gap-3"><span className="h-1.5 w-1.5 rounded-full bg-[#e8c87c] shadow-[0_0_9px_#e8c87c]" /> A visual record that becomes more personal over time</p>
                <p className="flex items-center gap-3"><span className="h-1.5 w-1.5 rounded-full bg-[#aa97f6] shadow-[0_0_9px_#aa97f6]" /> Constellations for trips, turning points, people, and eras</p>
                <p className="flex items-center gap-3"><span className="h-1.5 w-1.5 rounded-full bg-[#8fc8ff] shadow-[0_0_9px_#8fc8ff]" /> Searchable memories whenever you need perspective</p>
              </div>
            </Reveal>

            <Reveal delay={140} className="relative min-h-[510px] overflow-hidden rounded-[2rem] border border-white/[0.09] bg-[#070912] p-5 shadow-[0_36px_100px_rgba(0,0,0,0.4)] sm:p-8">
              <div className="landing-stars pointer-events-none absolute inset-0 opacity-45" aria-hidden="true" />
              <div className="landing-glow landing-glow-violet absolute -right-24 -top-24 h-72 w-72 rounded-full" aria-hidden="true" />
              <div className="relative flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/30">Constellation</p>
                  <p className="mt-2 text-lg font-bold text-white/90">Becoming brave</p>
                </div>
                <span className="rounded-full border border-violet-300/15 bg-violet-300/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-violet-200/70">5 memories</span>
              </div>

              <div className="relative mt-8 h-[300px]">
                <ConstellationConnections segments={featureSegments} />
                {emotionStars.map((star, index) => (
                  <div key={star.label} className="absolute" style={{ left: star.left, top: star.top }}>
                    <span
                      className={`landing-feature-star landing-twinkle absolute left-0 top-0 block -translate-x-1/2 -translate-y-1/2 rounded-full ${index === 2 ? 'h-3 w-3' : 'h-2 w-2'}`}
                      style={{
                        backgroundColor: star.color,
                        boxShadow: `0 0 20px ${star.color}`,
                        animationDelay: `${index * 280}ms`,
                        animationDuration: `${3 + (index % 2) * 0.8}s`,
                      }}
                    />
                    <span className="absolute left-0 top-3 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold uppercase tracking-wider text-white/30">{star.label}</span>
                  </div>
                ))}
              </div>

              <div className="relative grid grid-cols-3 gap-2 border-t border-white/[0.07] pt-5 text-center">
                <div><p className="text-lg font-bold">18</p><p className="text-[9px] uppercase tracking-widest text-white/30">day streak</p></div>
                <div><p className="text-lg font-bold">64</p><p className="text-[9px] uppercase tracking-widest text-white/30">total stars</p></div>
                <div><p className="text-lg font-bold">7</p><p className="text-[9px] uppercase tracking-widest text-white/30">chapters</p></div>
              </div>
            </Reveal>
          </div>

          <div className="mt-20 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Reveal className="h-full"><article className="h-full rounded-[1.6rem] border border-white/[0.08] bg-white/[0.025] p-6 transition duration-500 hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.04]">
              <Brain size={20} className="text-[#d0bfff]" />
              <h3 className="mt-6 font-bold">Emotion-aware stars</h3>
              <p className="mt-2 text-sm leading-6 text-[#858b9d]">Your sky carries the emotional texture of what you wrote, without reducing your words to a score.</p>
            </article></Reveal>
            <Reveal delay={90} className="h-full"><article className="h-full rounded-[1.6rem] border border-white/[0.08] bg-white/[0.025] p-6 transition duration-500 hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.04]">
              <Orbit size={20} className="text-[#e9cd93]" />
              <h3 className="mt-6 font-bold">Personal constellations</h3>
              <p className="mt-2 text-sm leading-6 text-[#858b9d]">Connect related memories in any order and name the story they tell together.</p>
            </article></Reveal>
            <Reveal delay={180} className="h-full"><article className="h-full rounded-[1.6rem] border border-white/[0.08] bg-white/[0.025] p-6 transition duration-500 hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.04]">
              <CalendarDays size={20} className="text-[#f3a879]" />
              <h3 className="mt-6 font-bold">Gentle momentum</h3>
              <p className="mt-2 text-sm leading-6 text-[#858b9d]">A daily rhythm and visible streak keep the ritual alive without turning reflection into a contest.</p>
            </article></Reveal>
            <Reveal delay={270} className="h-full"><article className="h-full rounded-[1.6rem] border border-white/[0.08] bg-white/[0.025] p-6 transition duration-500 hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.04]">
              <Search size={20} className="text-[#9bcaf5]" />
              <h3 className="mt-6 font-bold">Stellar archive</h3>
              <p className="mt-2 text-sm leading-6 text-[#858b9d]">Search, revisit, edit, and care for the entries behind every light in your sky.</p>
            </article></Reveal>
          </div>
        </div>
      </section>

      <section id="privacy" className="landing-deferred-section px-5 py-12 sm:px-8 lg:px-10">
        <Reveal className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-emerald-200/10 bg-[linear-gradient(120deg,rgba(10,22,24,0.95),rgba(10,12,22,0.95))] px-7 py-12 sm:px-12 lg:flex lg:items-center lg:justify-between lg:gap-16 lg:px-16 lg:py-14">
          <div className="landing-glow landing-glow-emerald absolute -left-20 top-0 h-52 w-52 rounded-full" aria-hidden="true" />
          <div className="relative max-w-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-200/10 bg-emerald-100/[0.05] text-emerald-100/70">
              <LockKeyhole size={20} />
            </div>
            <h2 className="mt-6 text-3xl font-black tracking-[-0.035em] sm:text-4xl">A private universe, made for you.</h2>
            <p className="mt-4 text-sm leading-7 text-[#8f9ba1] sm:text-base">
              No public profiles. No likes. No performance. AstroJournal is a personal space to be honest, notice patterns, and keep your memories close.
            </p>
          </div>
          <div className="relative mt-8 shrink-0 rounded-2xl border border-white/[0.07] bg-black/20 p-5 text-sm text-white/55 lg:mt-0 lg:w-72">
            <p className="flex items-center gap-3"><LockKeyhole size={15} className="text-emerald-200/65" /> Authenticated personal sky</p>
            <p className="mt-4 flex items-center gap-3"><Star size={15} className="text-emerald-200/65" /> Your entries, never a feed</p>
            <p className="mt-4 flex items-center gap-3"><Sparkles size={15} className="text-emerald-200/65" /> Delete your journal data anytime</p>
          </div>
        </Reveal>
      </section>

      <section className="landing-deferred-section relative px-5 py-28 text-center sm:px-8 sm:py-36 lg:px-10">
        <div className="landing-stars pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="landing-glow landing-glow-violet pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full" aria-hidden="true" />
        <Reveal className="relative mx-auto max-w-3xl">
          <Star className="landing-cta-star mx-auto text-[#efd392]" size={24} fill="currentColor" />
          <h2 className="mt-7 text-balance text-4xl font-black tracking-[-0.045em] sm:text-6xl">Tonight is a good place to begin.</h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-[#9196a7]">Every reflection. A new star. A little more of your life held where you can see it.</p>
          <Link
            to={primaryTo}
            className="landing-primary-cta group mt-9 inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-[#f8f5ed] px-7 py-4 text-sm font-black text-[#080910] shadow-[0_0_55px_rgba(248,245,237,0.14)] transition hover:bg-[#f1dfb8]"
          >
            {isSignedIn ? 'Open your sky' : 'Start your AstroJournal'}
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
          {!isSignedIn && <p className="mt-4 text-xs text-white/30">Your first star is free to create.</p>}
        </Reveal>
      </section>

      <footer className="relative overflow-hidden border-t border-white/[0.07] bg-[#04050b] px-5 pb-8 pt-16 sm:px-8 sm:pt-20 lg:px-10">
        <div className="landing-stars pointer-events-none absolute inset-x-0 top-0 h-64 opacity-20" aria-hidden="true" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-px w-[70%] -translate-x-1/2 bg-gradient-to-r from-transparent via-violet-200/30 to-transparent" aria-hidden="true" />
        <span className="pointer-events-none absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ead49f] shadow-[0_0_18px_#ead49f]" aria-hidden="true" />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid gap-12 border-b border-white/[0.07] pb-14 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8 lg:pb-16">
            <div className="sm:col-span-2 lg:col-span-5 lg:pr-16">
              <Logo className="text-2xl sm:text-3xl" />
              <p className="mt-4 max-w-md text-sm leading-7 text-white/40">
                A quiet place to turn daily reflections into a universe only you can call your own.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-200/10 bg-emerald-100/[0.04] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-100/55">
                <LockKeyhole size={13} />
                Private by design
              </div>
            </div>

            <div className="lg:col-span-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/25">Explore</p>
              <div className="mt-5 flex flex-col items-start gap-3.5 text-sm text-white/50">
                <a href="#how-it-works" className="transition hover:translate-x-0.5 hover:text-white">How it works</a>
                <a href="#features" className="transition hover:translate-x-0.5 hover:text-white">Features</a>
                <a href="#privacy" className="transition hover:translate-x-0.5 hover:text-white">Privacy</a>
              </div>
            </div>

            <div className="lg:col-span-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/25">Your sky</p>
              <div className="mt-5 flex flex-col items-start gap-3.5 text-sm text-white/50">
                <Link to={primaryTo} className="transition hover:translate-x-0.5 hover:text-white">
                  {isSignedIn ? 'Open your journal' : 'Create an account'}
                </Link>
                {!isSignedIn && <Link to="/login" className="transition hover:translate-x-0.5 hover:text-white">Sign in</Link>}
                <a href="#" className="transition hover:translate-x-0.5 hover:text-white">Back to the stars ↑</a>
              </div>
            </div>

            <div className="sm:col-span-2 lg:col-span-3">
              <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5">
                <div className="landing-glow landing-glow-violet absolute -right-10 -top-10 h-24 w-24 rounded-full" aria-hidden="true" />
                <div className="relative flex items-center justify-between">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#d8be87]">Tonight’s prompt</p>
                  <Star size={13} className="text-[#ead49f]" fill="currentColor" />
                </div>
                <p className="relative mt-5 text-base font-medium leading-7 text-white/75">
                  “What felt worth remembering today?”
                </p>
                <p className="relative mt-4 text-xs text-white/25">One sentence is enough to begin.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 pt-7 text-center text-xs text-white/25 sm:flex-row sm:text-left">
            <p>© {new Date().getFullYear()} AstroJournal. Your story stays yours.</p>
            <p className="inline-flex items-center gap-2">
              Made for reflection
              <span className="h-1 w-1 rounded-full bg-[#d8be87] shadow-[0_0_8px_#d8be87]" aria-hidden="true" />
              One star at a time
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default LandingPage;
