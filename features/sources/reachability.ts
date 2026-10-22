/** 배포 환경에서 각 데이터 출처에 닿는지 확인할 주소. 읽기만 한다. */
const TARGETS: { name: string; url: string; init?: RequestInit }[] = [
  { name: "Kalshi", url: "https://api.elections.kalshi.com/trade-api/v2/exchange/status" },
  {
    name: "NY Fed",
    url: "https://markets.newyorkfed.org/api/rates/unsecured/effr/last/1.json",
  },
  { name: "Polymarket Gamma", url: "https://gamma-api.polymarket.com/events?limit=1" },
  { name: "Polymarket Data API", url: "https://data-api.polymarket.com/v2/trades?limit=1" },
  { name: "Polymarket CLOB", url: "https://clob.polymarket.com/time" },
  {
    name: "Polygon RPC",
    url: "https://1rpc.io/matic",
    init: {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] }),
    },
  },
];

export type Reachability = {
  name: string;
  ok: boolean;
  status: number | null;
  ms: number;
  error?: string;
};

export async function checkReachability(fetcher: typeof fetch = fetch): Promise<Reachability[]> {
  return Promise.all(
    TARGETS.map(async ({ name, url, init }) => {
      const started = Date.now();
      try {
        const response = await fetcher(url, {
          ...init,
          headers: { "user-agent": "PreSignal/0.1", ...(init?.headers ?? {}) },
          signal: AbortSignal.timeout(10_000),
          cache: "no-store",
        });
        return { name, ok: response.ok, status: response.status, ms: Date.now() - started };
      } catch (error) {
        return {
          name,
          ok: false,
          status: null,
          ms: Date.now() - started,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),
  );
}
