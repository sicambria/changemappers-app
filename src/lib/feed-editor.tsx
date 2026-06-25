import { useEditor, Editor, ReactRenderer } from '@tiptap/react';
import { Node, mergeAttributes, Command } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
import type { SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import React from 'react';
import { detectVideoUrl } from './video-platforms';

export interface MentionUser {
  id: string;
  name: string;
  displayName?: string | null;
  profilePhoto?: string | null;
  bio?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// VideoEmbed Tiptap extension — handles ALL supported video platforms
// ─────────────────────────────────────────────────────────────────────────────

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    videoEmbed: {
      setVideoEmbed: (options: { src: string; platform: string }) => ReturnType;
    };
  }
}

const VideoEmbed = Node.create({
  name: 'videoEmbed',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src:      { default: null },
      platform: { default: 'unknown' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-video-embed]',
        getAttrs: (dom) => {
          const el = dom;
          return {
            src:      el.dataset.videoEmbed,
            platform: el.dataset.platform ?? 'unknown',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        {
          'data-video-embed': HTMLAttributes.src,
          'data-platform':    HTMLAttributes.platform,
          class: 'video-embed-block relative aspect-video rounded-xl overflow-hidden my-4 bg-black',
        },
      ),
      [
        'iframe',
        {
          src:             HTMLAttributes.src,
          class:           'w-full h-full',
          allowfullscreen: 'true',
          allow:           'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          frameborder:     '0',
        },
      ],
    ];
  },

  addCommands() {
    return {
      setVideoEmbed:
        (options: { src: string; platform: string }): Command =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },

  /**
   * Paste handler: if the user pastes a plain URL that matches any supported
   * video platform, convert it into a VideoEmbed node instead of plain text.
   */
  addProseMirrorPlugins() {
    const nodeName = this.name; // capture string — avoids no-this-alias
    return [
      new Plugin({
        props: {
          handlePaste(view, event) {
            const text = event.clipboardData?.getData('text/plain')?.trim();
            if (!text) return false;

            // Only act when the paste is a single URL (no whitespace)
            if (/\s/.test(text)) return false;

            const detected = detectVideoUrl(text);
            if (!detected) return false;

            const { state, dispatch } = view;
            const nodeType = state.schema.nodes[nodeName];
            if (!nodeType) return false;

            const node = nodeType.create({
              src:      detected.embedUrl,
              platform: detected.platform,
            });

            const tr = state.tr.replaceSelectionWith(node);
            dispatch(tr);
            event.preventDefault();
            return true;
          },
        },
      }),
    ];
  },
});

// ─────────────────────────────────────────────────────────────────────────────

interface UseFeedEditorOptions {
  placeholder?: string;
  onMentionSearch?: (query: string) => Promise<MentionUser[]>;
  onUpdate?: (editor: Editor) => void;
}

export function useFeedEditor({
  placeholder = 'Share something with the community...',
  onMentionSearch,
  onUpdate,
}: UseFeedEditorOptions = {}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        horizontalRule: false,
        // StarterKit v3 includes Link by default — disable so our explicit Link
        // extension (with custom HTMLAttributes) takes precedence without duplication.
        link: false,
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-4 border-emerald-500 pl-4 italic my-4',
          },
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-emerald-600 hover:text-emerald-700 underline',
        },
      }),
      VideoEmbed,
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-xl max-w-full my-4',
        },
      }),
      Placeholder.configure({ placeholder }),
      Mention.configure({
        HTMLAttributes: { class: 'mention' },
        suggestion: {
          items: async ({ query }: { query: string }): Promise<MentionUser[]> => {
            if (!onMentionSearch || query.length < 2) return [];
            return await onMentionSearch(query);
          },
          render: () => {
            let reactRenderer: ReactRenderer;
            let popup: TippyInstance[];

            return {
              onStart: (props: SuggestionProps<{ id: string; name: string }>) => {
                reactRenderer = new ReactRenderer(MentionList, {
                  props,
                  editor: props.editor,
                });
                if (!props.clientRect) return;
                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                  appendTo: () => document.body,
                  content: reactRenderer.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                });
              },
              onUpdate(props: SuggestionProps<{ id: string; name: string }>) {
                reactRenderer.updateProps(props);
                if (popup?.[0]) {
                  popup[0].setProps({
                    getReferenceClientRect: props.clientRect as () => DOMRect,
                  });
                }
              },
              onKeyDown(props: SuggestionKeyDownProps) {
                if (props.event.key === 'Escape') {
                  popup?.[0]?.hide();
                  return true;
                }
                return (reactRenderer.ref as { onKeyDown: (e: KeyboardEvent) => boolean })?.onKeyDown?.(props.event);
              },
              onExit() {
                popup?.forEach((p) => p.destroy());
                reactRenderer?.destroy();
              },
            };
          },
        },
      }),
    ],
    onUpdate: ({ editor }) => {
      onUpdate?.(editor);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-emerald max-w-none focus:outline-none min-h-[120px] p-4',
      },
    },
  });

  return editor;
}

// ─────────────────────────────────────────────────────────────────────────────
// MentionList component
// ─────────────────────────────────────────────────────────────────────────────

function MentionList(props: Readonly<{ items: MentionUser[]; command: (item: MentionUser) => void }>) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden max-h-60 overflow-y-auto">
      {props.items.length === 0 ? (
        <div className="px-3 py-2 text-gray-500 text-sm">No users found</div>
      ) : (
        props.items.map((user) => (
          <button
            key={user.id}
            className="flex items-center gap-3 w-full px-3 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors text-left"
            onClick={() => props.command(user)}
          >
            {user.profilePhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.profilePhoto} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="font-medium text-sm text-gray-900 dark:text-white">
                {user.displayName || user.name}
              </div>
              {user.bio && (
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                  {user.bio}
                </div>
              )}
            </div>
          </button>
        ))
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Content extraction utilities
// ─────────────────────────────────────────────────────────────────────────────

export function extractMentionsFromContent(content: string): string[] {
  const mentionRegex = /data-id="([^"]+)"/g;
  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    if (match[1]) mentions.push(match[1]);
  }
  return [...new Set(mentions)];
}

/** @deprecated Use extractVideoUrlsFromContent from lib/video-platforms instead */
export function extractYoutubeIdsFromContent(content: string): string[] {
  const youtubeRegex = /youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]{11})/g;
  const ids: string[] = [];
  let match;
  while ((match = youtubeRegex.exec(content)) !== null) {
    if (match[1]) ids.push(match[1]);
  }
  return [...new Set(ids)];
}

export function extractImageUrlsFromContent(content: string): string[] {
  const imgRegex = /<img[^>]+src="([^"]+)"/g;
  const urls: string[] = [];
  let match;
  while ((match = imgRegex.exec(content)) !== null) {
    if (match[1] && !match[1].includes('youtube') && !match[1].includes('vimeo')) {
      urls.push(match[1]);
    }
  }
  return [...new Set(urls)];
}
