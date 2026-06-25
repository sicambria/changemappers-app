import { getMapEntities as getMapData } from '@/app/actions/map';
import MapPageClient from './MapPageClient';

// Revalidate map data every 5 minutes — entities don't change that fast.
// After the first load, this page is served from the Next.js cache instantly.
export const revalidate = 300;

// Safety net: if the (now-cached) map fetch still takes too long on a cold
// cache, we render an empty map rather than hanging for 60+ seconds.
function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
    return Promise.race([p, new Promise<T>(r => setTimeout(() => r(fallback), ms))]);
}

export default async function MapPage() {
    const entities = await withTimeout(getMapData(), 5000, []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <MapPageClient entities={entities as any} />;
}
