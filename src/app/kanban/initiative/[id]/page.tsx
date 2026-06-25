import { getInitiativeAction } from '@/app/actions/coordinate';
import InitiativeDetailClient from './InitiativeDetailClient';

export const revalidate = 60;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function InitiativeDetailPage({ params }: Readonly<Props>) {
  const { id } = await params;
  const initiative = await getInitiativeAction(id);

  return <InitiativeDetailClient initiative={initiative} />;
}
