'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

type CanvasNode = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  positionX: number;
  positionY: number;
  deletedAt: Date | null;
  createdBy: { name: string | null };
  comments: { id: string; content: string; createdAt: Date; author: { id: string; name: string | null; profilePhoto: string | null } }[];
  interventions: { id: string; outcome: string; reflection: string }[];
};

type CanvasLink = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  linkType: string;
  deletedAt: Date | null;
};

interface CanvasEditSidebarProps {
  node: CanvasNode | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, data: { title?: string; description?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isOwner: boolean;
  links: CanvasLink[];
  nodes: CanvasNode[];
  onDeleteLink: (linkId: string) => Promise<void>;
}

export function CanvasEditSidebar({
  node,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  isOwner,
  links,
  nodes,
  onDeleteLink,
}: Readonly<CanvasEditSidebarProps>) {
  const { t } = useTranslation('canvas');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (node) {
      setTitle(node.title);
      setDescription(node.description || '');
    }
  }, [node]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    globalThis.addEventListener('keydown', handleEscape);
    return () => globalThis.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const debouncedSave = useCallback(async () => {
    if (!node || !isOwner) return;

    setSaving(true);
    await onUpdate(node.id, { title, description });
    setSaving(false);
  }, [node, title, description, onUpdate, isOwner]);

  const handleChange = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(debouncedSave, 500);
  }, [debouncedSave]);

  const handleDelete = async () => {
    if (!node || !confirm(t('editSidebar.deleteConfirm'))) return;
    await onDelete(node.id);
    onClose();
  };

  if (!node) return null;

  const nodeLinks = links.filter(l => l.fromNodeId === node.id || l.toNodeId === node.id);
  const linkedNodes = nodeLinks.map(link => {
    const otherId = link.fromNodeId === node.id ? link.toNodeId : link.fromNodeId;
    const otherNode = nodes.find(n => n.id === otherId);
    return { link, otherNode };
  }).filter((item): item is { link: CanvasLink; otherNode: CanvasNode } => !!item.otherNode);

  const sidebarClasses = isMobile
    ? 'fixed bottom-0 left-0 right-0 max-h-[70vh] bg-slate-900/95 backdrop-blur-sm rounded-t-2xl border-t border-slate-700 z-50 transition-transform duration-300 ease-out'
    : 'fixed right-0 top-0 h-full w-80 bg-slate-900/95 backdrop-blur-sm border-l border-slate-700 z-50 transition-transform duration-300 ease-out';

  let transform: string;
  if (isOpen) {
    transform = 'translate-x-0 translate-y-0';
  } else if (isMobile) {
    transform = 'translate-y-full';
  } else {
    transform = 'translate-x-full';
  }

  return (
    <div ref={sidebarRef} className={`${sidebarClasses} ${transform}`}>
      {isMobile && (
        <div className="flex justify-center py-2">
          <div className="w-12 h-1.5 rounded-full bg-slate-600" />
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
    <h2 className="text-lg font-semibold text-white">{t('editSidebar.editNode')}</h2>
    <div className="flex items-center gap-2">
      {saving && <span className="text-xs text-indigo-400 animate-pulse">{t('editSidebar.saving')}</span>}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            ×
          </button>
        </div>
      </div>

      <div className="p-4 overflow-y-auto" style={{ maxHeight: isMobile ? 'calc(70vh - 80px)' : 'calc(100vh - 80px)' }}>
        <div className="space-y-4">
    <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">{t('editSidebar.type')}</label>
            <div className="px-3 py-2 rounded-lg bg-slate-800 text-sm text-slate-300">
              {node.type.replaceAll('_', ' ')}
            </div>
          </div>

    <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">{t('editSidebar.title')}</label>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            handleChange();
          }}
          disabled={!isOwner}
          className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          placeholder={t('editSidebar.titlePlaceholder')}
        />
          </div>

    <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">{t('editSidebar.description')}</label>
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            handleChange();
          }}
          disabled={!isOwner}
          rows={4}
          className="w-full px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 resize-none"
          placeholder={t('editSidebar.descriptionPlaceholder')}
        />
          </div>

    <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">{t('editSidebar.position')}</label>
        <div className="flex gap-4 text-xs text-slate-400">
          <span>{t('editSidebar.posX')}: {Math.round(node.positionX)}</span>
          <span>{t('editSidebar.posY')}: {Math.round(node.positionY)}</span>
            </div>
          </div>

          <div>
      <label className="block text-xs font-medium text-slate-400 mb-2">{t('editSidebar.links')} ({linkedNodes.length})</label>
      {linkedNodes.length === 0 ? (
        <p className="text-xs text-slate-500">{t('editSidebar.noLinks')}</p>
            ) : (
              <div className="space-y-2">
                {linkedNodes.map(({ link, otherNode }) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800"
                  >
                    <div>
                      <span className="text-sm text-slate-200">{otherNode.title}</span>
                      <span className="text-xs text-slate-500 ml-2">
                        ({link.linkType.replaceAll('_', ' ').toLowerCase()})
                      </span>
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => onDeleteLink(link.id)}
          className="text-xs text-red-400 hover:text-red-300"
        >
          {t('editSidebar.remove')}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {node.comments.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">{t('editSidebar.comments')} ({node.comments.length})</label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {node.comments.slice(0, 3).map(comment => (
                  <div key={comment.id} className="px-3 py-2 rounded-lg bg-slate-800">
                    <div className="text-xs text-slate-500 mb-1">
                      {comment.author.name || t('editSidebar.unknown', { ns: 'canvas' })}
                    </div>
                    <p className="text-sm text-slate-300 line-clamp-2">{comment.content}</p>
                  </div>
                ))}
                {node.comments.length > 3 && (
        <p className="text-xs text-slate-500 text-center">
          {t('editSidebar.moreComments', { count: node.comments.length - 3 })}
                  </p>
                )}
              </div>
            </div>
          )}

          {isOwner && (
            <div className="pt-4 border-t border-slate-700">
              <button
                onClick={handleDelete}
                className="w-full px-4 py-2 rounded-lg bg-red-900/50 text-red-300 text-sm font-medium hover:bg-red-900 transition-colors"
        >
          {t('editSidebar.deleteNode')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
