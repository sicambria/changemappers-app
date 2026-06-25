import os from 'node:os';
import { isFeatureEnabled } from './security/kill-switch';

const SERVICE_NAME = '_changemappers._tcp.local';
const DEFAULT_TTL_SECONDS = 120;

export interface DiscoveredPeer {
  id: string;
  name: string;
  host: string;
  port: number;
  addresses: string[];
  discoveredAt: string;
  expiresAt: string;
}

interface DnsRecord {
  name?: string;
  type?: string;
  data?: unknown;
  ttl?: number;
}

interface DnsPacket {
  answers?: DnsRecord[];
}

interface MdnsInstance {
  query: (questions: { name: string; type: string }[]) => void;
  respond: (packet: unknown) => void;
  on: (event: 'response' | 'query', handler: (packet: unknown) => void) => void;
  destroy: () => void;
}

let peers = new Map<string, DiscoveredPeer>();
let started = false;
let mdnsInstance: MdnsInstance | null = null;

function getLocalAddresses(): string[] {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((address): address is os.NetworkInterfaceInfo => {
      if (!address) return false;
      return address.family === 'IPv4' && !address.internal;
    })
    .map((address) => address.address);
}

function getNodeId(): string {
  return process.env.CHANGEMAPPERS_NODE_ID || os.hostname();
}

function getPort(): number {
  const rawPort = process.env.PORT || process.env.NEXT_PUBLIC_PORT || '3000'; // SAFE: Shared port config
  const parsed = Number.parseInt(rawPort, 10);
  return Number.isFinite(parsed) ? parsed : 3000;
}

function pruneExpiredPeers(): void {
  const now = Date.now();
  peers = new Map([...peers].filter(([, peer]) => new Date(peer.expiresAt).getTime() > now));
}

function queryForPeers(): void {
  try {
    mdnsInstance?.query([{ name: SERVICE_NAME, type: 'PTR' }]);
  } catch (error) {
    console.warn('[discovery] peer query failed', error);
  }
}

function recordPeer(packet: DnsPacket): void {
  const answers = packet.answers ?? [];
  const txtRecord = answers.find((answer) => answer.type === 'TXT' && answer.name?.endsWith(SERVICE_NAME));
  const srvRecord = answers.find((answer) => answer.type === 'SRV' && answer.name?.endsWith(SERVICE_NAME));
  const addressRecords = answers.filter((answer) => answer.type === 'A');

  if (!txtRecord || !srvRecord) return;

  const txtData = Array.isArray(txtRecord.data) ? txtRecord.data : [];
  const fields = new Map<string, string>();
  txtData.forEach((entry) => {
    const value = Buffer.isBuffer(entry) ? entry.toString('utf8') : String(entry);
    const [key, ...rest] = value.split('=');
    if (key) fields.set(key, rest.join('='));
  });

  const id = fields.get('id');
  if (!id || id === getNodeId()) return;

  const srvData = srvRecord.data as { target?: string; port?: number } | undefined;
  const ttl = txtRecord.ttl ?? DEFAULT_TTL_SECONDS;
  const now = Date.now();
  peers.set(id, {
    id,
    name: fields.get('name') || id,
    host: srvData?.target || fields.get('host') || id,
    port: srvData?.port || getPort(),
    addresses: addressRecords
      .map((record) => String(record.data))
      .filter((address) => address && address !== 'undefined'),
    discoveredAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ttl * 1000).toISOString(),
  });
}

export async function startDiscoveryService(): Promise<void> {
  if (started) return;

  const envEnabled = process.env.ENABLE_MDNS_DISCOVERY === 'true' || process.env.NODE_ENV === 'development';
  const killSwitchEnabled = await isFeatureEnabled('lanDiscoveryEnabled');

  if (!envEnabled || !killSwitchEnabled) {
    started = true;
    return;
  }

  started = true;
  try {
    const { default: multicastDns } = await import('multicast-dns');
    const mdns = multicastDns({ multicast: true });
    mdnsInstance = mdns as unknown as MdnsInstance;
    const nodeId = getNodeId();
    const host = `${nodeId}.local`;
    const port = getPort();

    mdns.on('response', (packet) => recordPeer(packet as DnsPacket));
    mdns.on('query', () => {
      mdns.respond({
        answers: [
          { name: SERVICE_NAME, type: 'PTR' as const, ttl: DEFAULT_TTL_SECONDS, data: `${nodeId}.${SERVICE_NAME}` },
          { name: `${nodeId}.${SERVICE_NAME}`, type: 'SRV' as const, ttl: DEFAULT_TTL_SECONDS, data: { port, target: host } },
          {
            name: `${nodeId}.${SERVICE_NAME}`,
            type: 'TXT' as const,
            ttl: DEFAULT_TTL_SECONDS,
            data: [`id=${nodeId}`, `name=${process.env.CHANGEMAPPERS_NODE_NAME || nodeId}`, `host=${host}`],
          },
          ...getLocalAddresses().map((address) => ({ name: host, type: 'A' as const, ttl: DEFAULT_TTL_SECONDS, data: address })),
        ],
      });
    });

    queryForPeers();
  } catch (error) {
    console.warn('[discovery] mDNS unavailable, continuing without LAN discovery', error);
  }
}

export function stopDiscoveryServiceForTests(): void {
  mdnsInstance?.destroy();
  mdnsInstance = null;
  started = false;
  peers = new Map();
}

export async function getDiscoveredPeers(): Promise<DiscoveredPeer[]> {
  const killSwitchEnabled = await isFeatureEnabled('lanDiscoveryEnabled');
  if (!killSwitchEnabled) {
    if (mdnsInstance) {
      mdnsInstance.destroy();
      mdnsInstance = null;
      started = false;
      peers = new Map();
    }
    return [];
  }

  await startDiscoveryService();
  queryForPeers();
  pruneExpiredPeers();
  return [...peers.values()].sort((a, b) => a.name.localeCompare(b.name));
}
