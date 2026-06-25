'use client';

import { useState, useTransition } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronUpIcon } from 'lucide-react';
import { toast } from 'sonner';
import { toggleIdeaVote } from '@/app/actions/idea-post';

interface VoteButtonProps {
  ideaPostId: string;
  voteCount: number;
  hasVoted: boolean;
}

export function VoteButton({ ideaPostId, voteCount, hasVoted }: Readonly<VoteButtonProps>) {
  const { t } = useTranslation('roadmap');
  const [voted, setVoted] = useState(hasVoted);
  const [count, setCount] = useState(voteCount);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (isPending) return;
    const next = !voted;
    setVoted(next);
    setCount((c) => c + (next ? 1 : -1));
    startTransition(async () => {
      const result = await toggleIdeaVote(ideaPostId);
      if (!result.success) {
        setVoted(!next);
        setCount((c) => c + (next ? -1 : 1));
        toast.error(result.error || t('ideas.voteFailed'));
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={voted}
      aria-label={t('ideas.vote')}
      className={`flex flex-col items-center justify-center w-14 shrink-0 rounded-xl border px-2 py-2 transition-colors ${
        voted
          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
          : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-emerald-300 hover:text-emerald-600'
      } ${isPending ? 'opacity-60' : ''}`}
    >
      <ChevronUpIcon className={`w-5 h-5 ${voted ? 'fill-emerald-500' : ''}`} />
      <span className="text-sm font-bold tabular-nums">{count}</span>
    </button>
  );
}
