'use client';

import { useLanguage } from '@/components/providers/LanguageProvider';

interface ToolIframeClientProps {
  toolPath: string;
  title: string;
  bgColor?: string;
}

export function ToolIframeClient({ toolPath, title, bgColor = 'bg-stone-50' }: Readonly<ToolIframeClientProps>) {
  const { language } = useLanguage();
  const lang = language.split('-')[0] || 'hu';
  const src = `${toolPath}?lang=${lang}`;

  return (
    <div className={`min-h-screen ${bgColor}`}>
      <iframe
        src={src}
        className="w-full h-screen border-0"
        title={title}
      />
    </div>
  );
}
