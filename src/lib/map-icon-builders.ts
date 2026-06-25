import { safeAvatarCssUrl } from '@/lib/safe-avatar-url';
import { ARCHETYPE_RING_COLOR } from '@/lib/archetype-colors';
import type { MapEntity } from '@/components/map/map-entity-types';

function getIssueSeverityConfig(severity: string | null | undefined): { SIZE: number; color: string } {
  if (severity === 'CRITICAL') return { SIZE: 40, color: '#dc2626' };
  if (severity === 'HIGH') return { SIZE: 36, color: '#ea580c' };
  if (severity === 'MODERATE') return { SIZE: 32, color: '#f59e0b' };
  return { SIZE: 32, color: '#84cc16' };
}

function getSignalConfig(confidence: string | null | undefined, novelty: string | null | undefined): { SIZE: number; borderColor: string } {
  let SIZE: number;
  if (confidence === 'HIGH') SIZE = 36;
  else if (confidence === 'MEDIUM') SIZE = 32;
  else SIZE = 28;

  let borderColor = '#9ca3af';
  if (novelty === 'UNCOMMON') borderColor = '#0d9488';
  else if (novelty === 'RARE') borderColor = '#06b6d4';
  else if (novelty === 'NOVEL') borderColor = '#B5660D';

  return { SIZE, borderColor };
}

// Creates a Leaflet icon for a map entity.
// Individuals get a circular profile photo (or initials fallback).
// Communities and events fall back to the Leaflet default pin.
export function createEntityIcon(entity: MapEntity, L: typeof import('leaflet'), t: (key: string, opts?: Record<string, unknown>) => string) {
  if (entity.type === 'issue') {
    const { SIZE, color } = getIssueSeverityConfig(entity.issueSeverity);
    const pulse = entity.issueSeverity === 'CRITICAL' ? 'animation: pulse 1.5s ease-in-out infinite;' : '';
    const html =
      `<div style="width:${SIZE}px;height:${SIZE}px;border-radius:50%;` +
      `background:${color};border:2.5px solid white;` +
      `box-shadow:0 2px 8px rgba(0,0,0,0.45);` +
      `display:flex;align-items:center;justify-content:center;` +
      `color:white;font-weight:700;font-size:16px;font-family:sans-serif;${pulse}" ` +
      `class="${entity.issueSeverity === 'CRITICAL' ? 'animate-pulse' : ''}">` +
      `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>` +
      `</div>`;
    return L.divIcon({
      html,
      className: '',
      iconSize: [SIZE, SIZE],
      iconAnchor: [SIZE / 2, SIZE / 2],
      popupAnchor: [0, -(SIZE / 2 + 4)],
    });
  }
  if (entity.type === 'signal') {
    const { SIZE, borderColor } = getSignalConfig(entity.signalConfidence, entity.signalNovelty);
    const pulseClass = entity.signalNovelty === 'NOVEL' ? 'animate-pulse' : '';
    const pulseStyle = entity.signalNovelty === 'NOVEL' ? 'animation: pulse 2s ease-in-out infinite;' : '';
    const html =
      `<div style="width:${SIZE}px;height:${SIZE}px;border-radius:50%;` +
      `background:#059669;border:2.5px solid ${borderColor};` +
      `box-shadow:0 2px 8px rgba(0,0,0,0.45);` +
      `display:flex;align-items:center;justify-content:center;` +
      `color:white;font-weight:700;font-size:14px;font-family:sans-serif;${pulseStyle}" ` +
      `class="${pulseClass}" ` +
      `aria-label="${t('accessibility.signalMarker', { name: entity.name, domain: entity.signalDomain ?? t('accessibility.signal'), confidence: entity.signalConfidence ?? '' })}">` +
      `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/></svg>` +
      `</div>`;
    return L.divIcon({
      html,
      className: '',
      iconSize: [SIZE, SIZE],
      iconAnchor: [SIZE / 2, SIZE / 2],
      popupAnchor: [0, -(SIZE / 2 + 4)],
    });
  }
  if (entity.type !== 'individual') {
    return new L.Icon.Default();
  }
  const SIZE = 44;
  const initials = entity.name.charAt(0).toUpperCase();
  const safeAvatar = safeAvatarCssUrl(entity.avatar);
  const bg = safeAvatar
    ? `url('${safeAvatar}') center / cover no-repeat, #38bdf8`
    : '#38bdf8';
  const ringColor = ARCHETYPE_RING_COLOR[entity.archetypes?.[0] ?? ''] ?? '#38bdf8';
  const activeDot = entity.isRecentlyActive
    ? `<div style="position:absolute;bottom:1px;right:1px;width:11px;height:11px;` +
      `border-radius:50%;background:#4ade80;border:1.5px solid white;"></div>`
    : '';
  const html =
    `<div style="position:relative;width:${SIZE}px;height:${SIZE}px;border-radius:50%;` +
    `background:${bg};` +
    `box-shadow:0 0 0 2.5px white,0 0 0 5px ${ringColor},0 3px 10px rgba(0,0,0,0.5);` +
    `display:flex;align-items:center;justify-content:center;` +
    `color:white;font-weight:700;font-size:15px;font-family:sans-serif">` +
    `${safeAvatar ? '' : initials}${activeDot}</div>`;
  return L.divIcon({
    html,
    className: '',
    iconSize: [SIZE, SIZE],
    iconAnchor: [SIZE / 2, SIZE / 2],
    popupAnchor: [0, -(SIZE / 2 + 4)],
  });
}
