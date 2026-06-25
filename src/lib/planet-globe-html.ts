import type { MapEntity } from '@/app/actions/map';
import { safeAvatarCssUrl } from '@/lib/safe-avatar-url';
import { ARCHETYPE_RING_COLOR } from '@/lib/archetype-colors';

type PlanetCluster = {
    id: string;
    lat: number;
    lng: number;
    entities: (MapEntity & { lat: number; lng: number })[];
};

type GlobeHtmlHandlers = {
    onSelect: (entity: MapEntity & { lat?: number; lng?: number }) => void;
    onClusterExpand: (entities: MapEntity[], clientX: number, clientY: number) => void;
};

/**
 * Builds the imperative DOM element rendered for each clustered individual point
 * on the 3-D globe. A singleton renders a single avatar with an archetype ring;
 * a cluster renders stacked avatars + a count badge. Wired to the supplied
 * select / cluster-expand handlers.
 */
export function buildPlanetGlobeHtmlElement(d: unknown, { onSelect, onClusterExpand }: GlobeHtmlHandlers): HTMLElement {
    const cluster = d as PlanetCluster;
    const entities = cluster.entities;
    const isSingleton = entities.length === 1;

    const stopMarkerEvent = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
    };

    if (isSingleton) {
        // Single person — larger avatar with archetype ring
        const person = entities[0];
        const SIZE = 40;
        const avatar = safeAvatarCssUrl(person.avatar);
        const initials = person.name.charAt(0).toUpperCase();
        const ringColor = ARCHETYPE_RING_COLOR[person.archetypes?.[0] ?? ''] ?? '#38bdf8';
        const avatarBgSingle = avatar ? `url('${avatar}') center/cover no-repeat,` : '';
        const el = document.createElement('div');
        el.title = person.name;
        el.style.cssText =
            `width:${SIZE}px;height:${SIZE}px;border-radius:50%;` +
            `box-shadow:0 0 0 2.5px white,0 0 0 5px ${ringColor},0 3px 10px rgba(0,0,0,0.6);` +
            `cursor:pointer;overflow:visible;position:relative;` +
            `background:${avatarBgSingle}${ringColor};` +
            `display:flex;align-items:center;justify-content:center;` +
            `color:white;font-weight:700;font-size:13px;font-family:sans-serif;` +
            `pointer-events:auto`;
        if (!avatar) el.textContent = initials;
        if (person.isRecentlyActive) {
            const dot = document.createElement('div');
            dot.style.cssText = `position:absolute;bottom:1px;right:1px;width:10px;height:10px;border-radius:50%;background:#4ade80;border:1.5px solid white;`;
            el.appendChild(dot);
        }
        el.addEventListener('pointerdown', stopMarkerEvent);
        el.addEventListener('mousedown', stopMarkerEvent);
        el.addEventListener('touchstart', stopMarkerEvent, { passive: false });
        el.addEventListener('click', (event) => {
            stopMarkerEvent(event);
            onSelect(person);
        });
        return el;
    }

    // Cluster — stacked avatar circles + count badge
    const top2 = entities.slice(0, 2);
    const count = entities.length;
    const container = document.createElement('div');
    container.style.cssText = `position:relative;width:54px;height:54px;cursor:pointer;pointer-events:auto;`;
    container.title = `${count} changemakers`;

    top2.forEach((person, i) => {
        const avatar = safeAvatarCssUrl(person.avatar);
        const initials = person.name.charAt(0).toUpperCase();
        const ringColor = ARCHETYPE_RING_COLOR[person.archetypes?.[0] ?? ''] ?? '#38bdf8';
        const avatarBgCluster = avatar ? `url('${avatar}') center/cover no-repeat,` : '';
        const circle = document.createElement('div');
        circle.style.cssText =
            `position:absolute;width:30px;height:30px;border-radius:50%;` +
            `background:${avatarBgCluster}${ringColor};` +
            `box-shadow:0 0 0 2px white,0 2px 6px rgba(0,0,0,0.5);` +
            `display:flex;align-items:center;justify-content:center;` +
            `color:white;font-weight:700;font-size:10px;font-family:sans-serif;` +
            `left:${i * 16}px;top:12px;z-index:${2 - i}`;
        if (!avatar) circle.textContent = initials;
        container.appendChild(circle);
    });

    const badge = document.createElement('div');
    badge.style.cssText = `position:absolute;bottom:2px;right:2px;background:#0f172a;color:white;` +
        `border-radius:9999px;padding:1px 5px;font-size:10px;font-weight:700;font-family:sans-serif;` +
        `border:1.5px solid white;line-height:1.5;z-index:3`;
    badge.textContent = String(count);
    container.appendChild(badge);

    container.addEventListener('pointerdown', stopMarkerEvent);
    container.addEventListener('mousedown', stopMarkerEvent);
    container.addEventListener('touchstart', stopMarkerEvent, { passive: false });
    container.addEventListener('click', (event) => {
        stopMarkerEvent(event);
        onClusterExpand(entities as MapEntity[], (event as MouseEvent).clientX, (event as MouseEvent).clientY);
    });
    return container;
}
