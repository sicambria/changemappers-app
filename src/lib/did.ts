const DID_KEY_PATTERN = /^did:key:z[1-9A-HJ-NP-Za-km-z]{32,180}$/;

export function isValidDidKey(value: string): boolean {
  return DID_KEY_PATTERN.test(value);
}
