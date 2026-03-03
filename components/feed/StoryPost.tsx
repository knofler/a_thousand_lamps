interface Props {
  title?: string;
  caption?: string;
  imageUrl?: string;
  tags?: string[];
}

export default function StoryPost({ title, caption, imageUrl }: Props) {
  return (
    <div
      className="relative w-full min-h-52 flex flex-col justify-end p-5 text-white overflow-hidden"
      style={{
        background: imageUrl
          ? `linear-gradient(to top, rgba(0,0,0,0.85) 30%, rgba(0,0,0,0.1)), url(${imageUrl}) center/cover`
          : 'linear-gradient(135deg, #18181B 0%, #27272A 100%)',
      }}
    >
      {/* Amber accent line — inside overflow-hidden so it stays contained */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
      <div className="pl-3">
        {title && (
          <h3 className="font-serif text-xl font-bold leading-snug mb-1 text-white">{title}</h3>
        )}
        {caption && (
          <p className="text-sm opacity-80 leading-relaxed text-zinc-200">{caption}</p>
        )}
      </div>
    </div>
  );
}
