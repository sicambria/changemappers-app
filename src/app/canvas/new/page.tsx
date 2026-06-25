import NewDiagramPageClient from '@/components/features/canvas/NewDiagramPageClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New Diagram | Drawing Board',
  description: 'Create a new diagram on the Drawing Board.',
};

export default function NewCanvasPage() {
  return <NewDiagramPageClient />;
}
