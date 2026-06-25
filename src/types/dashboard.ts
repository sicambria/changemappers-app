// Shared dashboard types — NOT a server file.
// Import from here in both server and client code.

export const DASHBOARD_TILE_IDS = [
    'connect-self',
    'connect-nature',
    'connect-others',
    'learning',
    'direct-action',
    'system-sensing',
    'grow',
    'offer',
'canvas',
  'kanban',
] as const;

export type TileId = (typeof DASHBOARD_TILE_IDS)[number];

export interface DashboardTile {
    id: TileId;
    visible: boolean;
}
