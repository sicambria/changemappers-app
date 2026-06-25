const ROOM_PATTERN = /^[a-zA-Z0-9_-]{3,64}$/;

export function normalizeVideoRoomInput(value: string): string {
  return value.trim().replaceAll(/\s+/g, '-').replaceAll(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);
}

export function isValidVideoRoomName(roomName: string): boolean {
  return ROOM_PATTERN.test(roomName);
}
