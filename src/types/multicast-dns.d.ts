declare module 'multicast-dns' {
  interface MulticastDnsOptions {
    multicast?: boolean;
  }

  interface MulticastDnsInstance {
    on(event: 'response' | 'query', listener: (packet: unknown) => void): void;
    query(query: unknown): void;
    respond(response: unknown): void;
    destroy(): void;
  }

  export default function multicastDns(options?: MulticastDnsOptions): MulticastDnsInstance;
}
