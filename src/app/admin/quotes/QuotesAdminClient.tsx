'use client';

import { useState, useCallback } from 'react';
import { QuoteIcon, PlusIcon, Trash2Icon, CheckIcon, XIcon } from 'lucide-react';
import {
  adminGetQuotesAction,
  adminCreateQuoteAction,
  adminUpdateQuoteAction,
  adminDeleteQuoteAction,
} from '@/app/actions/admin/quotes';
import { useValidationErrors } from '@/hooks/useValidationErrors';
import { ActionRequirements } from '@/components/ui/ActionRequirements';

interface QuoteData {
  id: string;
  text: string;
  author: string;
  source: string | null;
  isActive: boolean;
}

export function QuotesAdminClient({ initialQuotes }: Readonly<{ initialQuotes: QuoteData[] }>) {
  const [quotes, setQuotes] = useState<QuoteData[]>(initialQuotes);
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [source, setSource] = useState('');
  const { formError, setErrors, clearErrors } = useValidationErrors();

  const refresh = useCallback(async () => {
    const result = await adminGetQuotesAction();
    if (result.success && result.data) setQuotes(result.data);
  }, []);

  const handleCreate = async () => {
    clearErrors();
    const result = await adminCreateQuoteAction(text, author, source || undefined);
    if (result.success) {
      setShowForm(false);
      setText('');
      setAuthor('');
      setSource('');
      refresh();
    } else {
      setErrors(result);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await adminUpdateQuoteAction(id, { isActive });
    setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, isActive } : q)));
  };

  const handleDelete = async (id: string) => {
    if (!globalThis.confirm('Delete this quote?')) return;
    await adminDeleteQuoteAction(id);
    setQuotes((prev) => prev.filter((q) => q.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <QuoteIcon className="h-5 w-5 text-amber-500" />
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Quotes</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-sm text-white hover:bg-amber-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Add Quote
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Quote text"
            rows={2}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm"
          />
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Author"
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm"
          />
          <input
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Source (optional, e.g. book title)"
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm"
          />
          {formError && <p className="text-sm text-red-500">{formError}</p>}
          <ActionRequirements id="quote-create-requirements" requirements={[!text.trim() && 'Enter quote text', !author.trim() && 'Enter author']} />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!text.trim() || !author.trim()}
              aria-describedby={(!text.trim() || !author.trim()) ? 'quote-create-requirements' : undefined}
              className="rounded-md bg-amber-600 px-3 py-1.5 text-sm text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Text</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Author</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Source</th>
              <th className="px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Active</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {quotes.map((quote) => (
              <tr key={quote.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-2.5 text-sm text-gray-900 dark:text-white max-w-[300px] truncate">
                  &ldquo;{quote.text}&rdquo;
                </td>
                <td className="px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400">
                  {quote.author}
                </td>
                <td className="px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400">
                  {quote.source || '—'}
                </td>
                <td className="px-4 py-2.5 text-center">
                  <button
                    onClick={() => handleToggleActive(quote.id, !quote.isActive)}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                      quote.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {quote.isActive ? <CheckIcon className="h-2.5 w-2.5" /> : <XIcon className="h-2.5 w-2.5" />}
                    {quote.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={() => handleDelete(quote.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2Icon className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {quotes.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                  No quotes configured.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
