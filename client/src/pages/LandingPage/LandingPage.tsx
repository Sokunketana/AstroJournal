import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/react';
import { Link } from '@tanstack/react-router';
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
    title: 'Capture one honest moment',
    copy: 'A single thoughtful entry each day keeps reflection focused, sustainable, and worth returning to.',
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
              background: `linear-gradient(90deg, ${segment.fromColor}, ${segment.toColor})`,
              boxShadow: `0 0 6px ${segment.fromColor}22`,
            }}
          />
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

const LandingPage = () => {
  const { isSignedIn } = useAuth();
  const primaryTo = isSignedIn ? '/app' : '/sign-up';

  return (
    <main className="min-h-screen overflow-hidden bg-[#03040a] text-[#f8f5ed]">
      <section className="relative isolate min-h-screen border-b border-white/[0.06]">
        <div className="landing-stars pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="pointer-events-none absolute left-[10%] top-24 h-72 w-72 rounded-full bg-violet-600/15 blur-[120px]" aria-hidden="true" />
        <div className="pointer-events-none absolute right-[4%] top-[28%] h-96 w-96 rounded-full bg-amber-400/10 blur-[140px]" aria-hidden="true" />

        <nav className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
          <Link to="/" aria-label="AstroJournal home">
            <Logo className="text-xl sm:text-2xl" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="mr-3 hidden items-center gap-7 text-sm text-white/50 lg:flex">
              <a href="#how-it-works" className="transition hover:text-white">How it works</a>
              <a href="#features" className="transition hover:text-white">Features</a>
              <a href="#privacy" className="transition hover:text-white">Privacy</a>
            </div>
            {!isSignedIn && (
              <Link
                to="/login"
                className="rounded-full px-4 py-2 text-sm font-medium text-white/65 transition hover:text-white"
              >
                Sign in
              </Link>
            )}
            <Link
              to={primaryTo}
              className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white px-4 py-2 text-sm font-bold text-[#06070d] transition hover:bg-[#f1dfb8] sm:px-5"
            >
              {isSignedIn ? 'Open your sky' : 'Start journaling'}
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </nav>

        <div className="relative z-10 mx-auto grid min-h-[calc(100vh-92px)] w-full max-w-7xl items-center gap-14 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:pb-24 lg:pt-8">
          <div className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-amber-200/15 bg-amber-100/[0.05] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#e6c98e]">
              <Sparkles size={14} />
              A journal written in the stars
            </div>
            <h1 className="text-balance text-5xl font-black leading-[0.95] tracking-[-0.055em] sm:text-6xl lg:text-[5.3rem]">
              Write your day.
              <span className="mt-2 block bg-gradient-to-r from-[#f4dfb7] via-white to-[#a89cf6] bg-clip-text text-transparent">
                Build your universe.
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-pretty text-base leading-7 text-[#9ca1b3] sm:text-lg sm:leading-8">
              Turn one honest reflection a day into a living night sky. Every entry becomes a star, every streak builds momentum, and every constellation preserves a chapter of your life.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to={primaryTo}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#f8f5ed] px-6 py-3.5 text-sm font-black text-[#080910] shadow-[0_0_45px_rgba(248,245,237,0.12)] transition hover:bg-[#f1dfb8]"
              >
                {isSignedIn ? 'Return to your universe' : 'Create your first star'}
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold text-white/65 transition hover:text-white"
              >
                See how it works
                <span aria-hidden="true">↓</span>
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/45">
              <span className="inline-flex items-center gap-2"><Star size={14} className="text-[#e8c87c]" /> One meaningful entry a day</span>
              <span className="inline-flex items-center gap-2"><Flame size={14} className="text-[#f08d5d]" /> Gentle streaks, no noisy feeds</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[650px] lg:mx-0">
            <div className="absolute -inset-10 rounded-full bg-violet-500/[0.07] blur-3xl" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#070912]/80 p-3 shadow-[0_32px_100px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-4">
              <div className="flex items-center justify-between px-3 pb-3 pt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
                <span>Your night sky</span>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-orange-300/70"><Flame size={12} /> 12</span>
                  <span className="inline-flex items-center gap-1 text-amber-200/70"><Star size={12} /> 48</span>
                </div>
              </div>
              <div className="relative aspect-[1.12/0.78] min-h-[360px] overflow-hidden rounded-[1.45rem] border border-white/[0.07] bg-[radial-gradient(circle_at_50%_120%,#251b46_0%,#0b0d1b_38%,#03040a_76%)]">
                <div className="landing-preview-grid absolute inset-0 opacity-35" aria-hidden="true" />
                <ConstellationConnections segments={previewSegments} />
                {previewStars.map((star, index) => (
                  <span
                    key={index}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full ${index === 3 ? 'animate-pulse' : ''}`}
                    style={{
                      left: star.left,
                      top: star.top,
                      width: star.size,
                      height: star.size,
                      background: star.glow,
                      boxShadow: `0 0 ${star.size * 3}px ${star.glow}`,
                    }}
                  />
                ))}
                <div className="absolute left-[55%] top-[46%] -translate-x-1/2 translate-y-5 rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-center backdrop-blur-md">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-amber-200/70">Tonight</p>
                  <p className="mt-0.5 text-xs text-white/80">I finally made time to breathe.</p>
                </div>
                <div className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-2 pl-4 backdrop-blur-md sm:inset-x-6 sm:bottom-6">
                  <span className="flex-1 text-xs text-white/40 sm:text-sm">Reflect on your day across the universe…</span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                    <Rocket size={17} className="-rotate-45" />
                  </span>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-4 rounded-2xl border border-white/10 bg-[#0c0e17]/90 px-4 py-3 shadow-2xl backdrop-blur-xl sm:-left-8">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/35">Current chapter</p>
              <p className="mt-1 text-sm font-semibold text-[#e7ddff]">Finding my orbit · 7 stars</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="relative border-b border-white/[0.06] px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-80 w-[60%] -translate-x-1/2 rounded-full bg-violet-800/[0.06] blur-[120px]" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#d7bb80]">A quieter daily ritual</p>
            <h2 className="mt-5 text-balance text-4xl font-black tracking-[-0.04em] sm:text-5xl">
              Three small steps. A universe of perspective.
            </h2>
            <p className="mt-5 text-base leading-7 text-[#9095a7]">
              AstroJournal turns reflection into something you can see, revisit, and feel growing around you.
            </p>
          </div>

          <div className="relative mt-16 grid gap-4 lg:grid-cols-3">
            <div className="pointer-events-none absolute left-[17%] right-[17%] top-12 hidden h-px bg-gradient-to-r from-transparent via-white/15 to-transparent lg:block" aria-hidden="true" />
            {steps.map(({ number, icon: Icon, title, copy }) => (
              <article key={number} className="group relative rounded-[1.75rem] border border-white/[0.08] bg-white/[0.025] p-7 transition duration-500 hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.045] sm:p-8">
                <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-[#0d0f19] text-[#e9d6ad] shadow-[0_0_30px_rgba(225,198,142,0.06)]">
                  <Icon size={21} />
                </div>
                <p className="mt-10 text-[10px] font-black tracking-[0.25em] text-white/25">ORBIT {number}</p>
                <h3 className="mt-3 text-xl font-bold tracking-tight text-white/90">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#858b9d]">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="relative px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-14 lg:grid-cols-[0.82fr_1.18fr] lg:gap-24">
            <div>
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
            </div>

            <div className="relative min-h-[510px] overflow-hidden rounded-[2rem] border border-white/[0.09] bg-[#070912] p-5 shadow-[0_36px_100px_rgba(0,0,0,0.4)] sm:p-8">
              <div className="landing-stars pointer-events-none absolute inset-0 opacity-45" aria-hidden="true" />
              <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-500/10 blur-[90px]" aria-hidden="true" />
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
                  <div key={star.label} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: star.left, top: star.top }}>
                    <span
                      className={`block rounded-full ${index === 2 ? 'h-3 w-3' : 'h-2 w-2'}`}
                      style={{ backgroundColor: star.color, boxShadow: `0 0 20px ${star.color}` }}
                    />
                    <span className="mt-3 block -translate-x-1/3 text-[9px] font-bold uppercase tracking-wider text-white/30">{star.label}</span>
                  </div>
                ))}
              </div>

              <div className="relative grid grid-cols-3 gap-2 border-t border-white/[0.07] pt-5 text-center">
                <div><p className="text-lg font-bold">18</p><p className="text-[9px] uppercase tracking-widest text-white/30">day streak</p></div>
                <div><p className="text-lg font-bold">64</p><p className="text-[9px] uppercase tracking-widest text-white/30">total stars</p></div>
                <div><p className="text-lg font-bold">7</p><p className="text-[9px] uppercase tracking-widest text-white/30">chapters</p></div>
              </div>
            </div>
          </div>

          <div className="mt-20 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-[1.6rem] border border-white/[0.08] bg-white/[0.025] p-6">
              <Brain size={20} className="text-[#d0bfff]" />
              <h3 className="mt-6 font-bold">Emotion-aware stars</h3>
              <p className="mt-2 text-sm leading-6 text-[#858b9d]">Your sky carries the emotional texture of what you wrote, without reducing your words to a score.</p>
            </article>
            <article className="rounded-[1.6rem] border border-white/[0.08] bg-white/[0.025] p-6">
              <Orbit size={20} className="text-[#e9cd93]" />
              <h3 className="mt-6 font-bold">Personal constellations</h3>
              <p className="mt-2 text-sm leading-6 text-[#858b9d]">Connect related memories in any order and name the story they tell together.</p>
            </article>
            <article className="rounded-[1.6rem] border border-white/[0.08] bg-white/[0.025] p-6">
              <CalendarDays size={20} className="text-[#f3a879]" />
              <h3 className="mt-6 font-bold">Gentle momentum</h3>
              <p className="mt-2 text-sm leading-6 text-[#858b9d]">A daily rhythm and visible streak keep the ritual alive without turning reflection into a contest.</p>
            </article>
            <article className="rounded-[1.6rem] border border-white/[0.08] bg-white/[0.025] p-6">
              <Search size={20} className="text-[#9bcaf5]" />
              <h3 className="mt-6 font-bold">Stellar archive</h3>
              <p className="mt-2 text-sm leading-6 text-[#858b9d]">Search, revisit, edit, and care for the entries behind every light in your sky.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="privacy" className="px-5 py-12 sm:px-8 lg:px-10">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-emerald-200/10 bg-[linear-gradient(120deg,rgba(10,22,24,0.95),rgba(10,12,22,0.95))] px-7 py-12 sm:px-12 lg:flex lg:items-center lg:justify-between lg:gap-16 lg:px-16 lg:py-14">
          <div className="absolute -left-20 top-0 h-52 w-52 rounded-full bg-emerald-400/[0.06] blur-[80px]" aria-hidden="true" />
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
        </div>
      </section>

      <section className="relative px-5 py-28 text-center sm:px-8 sm:py-36 lg:px-10">
        <div className="landing-stars pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/10 blur-[120px]" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl">
          <Star className="mx-auto text-[#efd392]" size={24} fill="currentColor" />
          <h2 className="mt-7 text-balance text-4xl font-black tracking-[-0.045em] sm:text-6xl">Tonight is a good place to begin.</h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-[#9196a7]">One reflection. One new star. A little more of your life held where you can see it.</p>
          <Link
            to={primaryTo}
            className="group mt-9 inline-flex items-center justify-center gap-2 rounded-full bg-[#f8f5ed] px-7 py-4 text-sm font-black text-[#080910] shadow-[0_0_55px_rgba(248,245,237,0.14)] transition hover:bg-[#f1dfb8]"
          >
            {isSignedIn ? 'Open your sky' : 'Start your AstroJournal'}
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </Link>
          {!isSignedIn && <p className="mt-4 text-xs text-white/30">Your first star is free to create.</p>}
        </div>
      </section>

      <footer className="border-t border-white/[0.06] px-5 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left">
          <div>
            <Logo className="text-lg" />
            <p className="mt-1 text-xs text-white/30">A journal written in the stars.</p>
          </div>
          <div className="flex items-center gap-6 text-xs text-white/35">
            <a href="#how-it-works" className="transition hover:text-white">How it works</a>
            <a href="#features" className="transition hover:text-white">Features</a>
            {!isSignedIn && <Link to="/login" className="transition hover:text-white">Sign in</Link>}
          </div>
          <p className="text-xs text-white/25">© {new Date().getFullYear()} AstroJournal</p>
        </div>
      </footer>
    </main>
  );
};

export default LandingPage;
