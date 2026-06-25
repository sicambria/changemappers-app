'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { toast } from 'sonner';
import { PlusIcon, Loader2Icon, ChevronLeftIcon, ChevronRightIcon, LightbulbIcon } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuth } from '@/components/providers/AuthProvider';
import { getIdeaPosts } from '@/app/actions/idea-post';
import type { GetIdeaPostsInput } from '@/lib/validations/idea-post';
import { IdeaCard } from './IdeaCard';
import { IdeaFilterBar, DEFAULT_IDEA_FILTERS, type IdeaFilterState } from './IdeaFilterBar';
import { IdeaSubmitModal } from './IdeaSubmitModal';
import type { IdeaPostListItem } from './types';

function IdeaLoginPrompt() {
  const { t } = useTranslation('roadmap');
  return (
    <div className="rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 p-10 text-center">
      <LightbulbIcon className="mx-auto mb-4 h-10 w-10 text-emerald-400" />
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('ideas.loginPrompt.title')}</h3>
      <p className="mt-1 text-sm text-gray-500">{t('ideas.loginPrompt.description')}</p>
      <div className="mt-4 flex justify-center gap-3">
        <Link href="/login"><Button>{t('ideas.loginPrompt.login')}</Button></Link>
        <Link href="/register"><Button variant="outline">{t('ideas.loginPrompt.register')}</Button></Link>
      </div>
    </div>
  );
}

function IdeaPagination({ page, hasMore, onPage }: Readonly<{ page: number; hasMore: boolean; onPage: (p: number) => void }>) {
  const { t } = useTranslation(['roadmap', 'common']);
  if (page === 1 && !hasMore) return null;
  return (
    <div className="flex items-center justify-center gap-4 pt-2">
      <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPage(page - 1)}>
        <ChevronLeftIcon className="mr-1 h-4 w-4" />{t('common:actions.back')}
      </Button>
      <span className="text-sm font-medium tabular-nums">{page}</span>
      <Button variant="outline" size="sm" disabled={!hasMore} onClick={() => onPage(page + 1)}>
        {t('common:actions.next')}<ChevronRightIcon className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}

function IdeaList({ posts, isLoading, currentUserId, isAdmin }: Readonly<{
  posts: IdeaPostListItem[]; isLoading: boolean; currentUserId: string; isAdmin: boolean;
}>) {
  const { t } = useTranslation('roadmap');
  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2Icon className="h-8 w-8 animate-spin text-emerald-500" /></div>;
  }
  if (posts.length === 0) {
    return <p className="py-16 text-center text-gray-400">{t('ideas.empty')}</p>;
  }
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <IdeaCard key={post.id} post={post} currentUserId={currentUserId} isAdmin={isAdmin} />
      ))}
    </div>
  );
}

function IdeaBoardRegistered({ currentUserId, isAdmin }: Readonly<{ currentUserId: string; isAdmin: boolean }>) {
  const { t } = useTranslation('roadmap');
  const translateRef = useRef(t);
  useEffect(() => { translateRef.current = t; });
  const [posts, setPosts] = useState<IdeaPostListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<IdeaFilterState>(DEFAULT_IDEA_FILTERS);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(filters.search), 300);
    return () => clearTimeout(id);
  }, [filters.search]);

  useEffect(() => { setPage(1); }, [filters.type, filters.status, filters.sort, debouncedSearch]);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    const input: GetIdeaPostsInput = {
      type: (filters.type || undefined) as GetIdeaPostsInput['type'],
      status: (filters.status || undefined) as GetIdeaPostsInput['status'],
      sort: filters.sort,
      search: debouncedSearch || undefined,
      page,
      pageSize: 20,
    };
    const result = await getIdeaPosts(input);
    if (result.success) {
      setPosts(result.data as IdeaPostListItem[]);
      setHasMore(result.hasMore);
    } else {
      toast.error(result.error || translateRef.current('ideas.fetchFailed'));
    }
    setIsLoading(false);
  }, [filters.type, filters.status, filters.sort, debouncedSearch, page]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <IdeaFilterBar filters={filters} onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))} />
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <PlusIcon className="h-4 w-4" />{t('ideas.submitButton')}
        </Button>
      </div>
      <IdeaList posts={posts} isLoading={isLoading} currentUserId={currentUserId} isAdmin={isAdmin} />
      <IdeaPagination page={page} hasMore={hasMore} onPage={setPage} />
      <IdeaSubmitModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onCreated={fetchPosts} />
    </div>
  );
}

export function IdeaBoard() {
  const { t } = useTranslation('roadmap');
  const { user, isAuthenticated } = useAuth();
  const isRegistered = isAuthenticated && !!user && user.profileType !== 'GUEST';

  return (
    <section className="mt-20">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('ideas.boardTitle')}</h2>
        <p className="mt-1 text-gray-500">{t('ideas.boardSubtitle')}</p>
      </div>
      {isRegistered
        ? <IdeaBoardRegistered currentUserId={user.id} isAdmin={!!user.isAdmin} />
        : <IdeaLoginPrompt />}
    </section>
  );
}
