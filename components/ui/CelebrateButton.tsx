'use client';

import { useRouter } from 'next/navigation';

interface Props {
  size?: 'sm' | 'lg';
}

export default function CelebrateButton({ size = 'lg' }: Props) {
  const router = useRouter();

  const base = 'font-semibold rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 ' +
               'transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] ' +
               'cursor-pointer select-none shadow-lg shadow-amber-500/20';

  const sizing = size === 'sm'
    ? 'text-sm px-4 py-2'
    : 'text-lg px-8 py-3.5';

  return (
    <button className={`${base} ${sizing}`} onClick={() => router.push('/celebrate')}>
      🎉 Celebrate
    </button>
  );
}
