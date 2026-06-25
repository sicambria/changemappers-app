'use client';

import nextDynamic from 'next/dynamic';
import type { GraphNode, GraphLink } from '@/types/graph';

const SystemicGraphClient = nextDynamic(
  () => import('@/components/features/graph/SystemicGraphClient'),
  { ssr: false }
);

interface Props {
  initialNodes: GraphNode[];
  initialLinks: GraphLink[];
}

export default function SystemicGraphWrapper({ initialNodes, initialLinks }: Readonly<Props>) {
  return <SystemicGraphClient initialNodes={initialNodes} initialLinks={initialLinks} />;
}
