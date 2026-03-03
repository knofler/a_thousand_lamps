import CelebrateButton from '@/components/ui/CelebrateButton';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-14 overflow-hidden">
      {/* Ambient glow — purely decorative */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 20%, rgba(245,158,11,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-2xl">
        {/* Lamp icon */}
        <div className="text-6xl mb-6 opacity-90">🪔</div>

        <h1
          className="font-serif text-5xl md:text-6xl font-bold mb-5 leading-tight tracking-tight"
          style={{ color: 'var(--text)' }}
        >
          A Thousand Lamps
        </h1>

        <p className="text-lg md:text-xl leading-relaxed mb-3 max-w-lg mx-auto" style={{ color: 'var(--muted)' }}>
          A Bangladesh-based charitable initiative lighting lives through Ramadan
          meals, Eid gifts, limb support, and community care.
        </p>

        <p className="text-sm mb-10 italic" style={{ color: 'var(--muted)', opacity: 0.6 }}>
          Every lamp you light changes someone's darkness forever.
        </p>

        <CelebrateButton size="lg" />
      </div>

      {/* Scroll hint */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs flex flex-col items-center gap-2"
        style={{ color: 'var(--muted)', opacity: 0.5 }}
      >
        <span>Scroll to see the impact</span>
        <span className="animate-bounce">↓</span>
      </div>
    </section>
  );
}
