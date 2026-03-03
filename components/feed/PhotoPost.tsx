import Image from 'next/image';

interface Props {
  imageUrl: string;
  caption?: string;
  title?: string;
}

export default function PhotoPost({ imageUrl, caption, title }: Props) {
  return (
    <div>
      <div className="relative w-full aspect-[4/3] bg-gray-100">
        <Image
          src={imageUrl}
          alt={caption ?? title ?? 'A Thousand Lamps photo'}
          fill
          className="object-cover"
          sizes="(max-width: 512px) 100vw, 512px"
        />
      </div>
      {caption && (
        <p className="px-4 pt-3 pb-1 text-sm text-lamp-dark leading-relaxed">{caption}</p>
      )}
    </div>
  );
}
