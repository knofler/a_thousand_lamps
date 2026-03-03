const PANELS = [
  { emoji: '👦', text: 'A boy in a village had nothing to give — no money, no food, no gifts.' },
  { emoji: '🕯️', text: "He found a single candle and lit it in the darkness of his neighbour's home." },
  { emoji: '🏘️', text: 'One by one, neighbours saw the light and passed it on through the whole village.' },
  { emoji: '🪔', text: 'By morning, a thousand lamps burned — all from one small act of love.' },
];

export default function ComicStory() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">
          Origin Story
        </p>
        <h2 className="font-serif text-3xl md:text-4xl font-bold mb-2" style={{ color: 'var(--text)' }}>
          The Boy Who Lit a Lamp
        </h2>
        <p className="text-sm mb-12" style={{ color: 'var(--muted)' }}>The story behind our name</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {PANELS.map((panel, i) => (
            <div
              key={i}
              className="rounded-2xl p-5 flex flex-col items-center gap-3 border"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="text-5xl">{panel.emoji}</div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                {panel.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
