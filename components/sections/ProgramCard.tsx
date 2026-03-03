import Link from 'next/link';

interface Props {
  slug: string;
  title: string;
  description: string;
  emoji: string;
}

export default function ProgramCard({ slug, title, description, emoji }: Props) {
  return (
    <Link
      href={`/programs#${slug}`}
      className="flex-shrink-0 w-52 rounded-2xl p-5 border
                 hover:border-amber-500/50 hover:-translate-y-1
                 transition-all duration-200 text-center group"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="text-4xl mb-3">{emoji}</div>
      <h3
        className="font-serif font-bold text-sm mb-1 group-hover:text-amber-500 transition-colors"
        style={{ color: 'var(--text)' }}
      >
        {title}
      </h3>
      <p className="text-xs leading-relaxed line-clamp-3" style={{ color: 'var(--muted)' }}>
        {description}
      </p>
    </Link>
  );
}
