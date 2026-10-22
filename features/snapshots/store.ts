export type Stored<T> = { fetchedAt: number; data: T };

export interface SnapshotStore {
  get<T>(key: string): Promise<Stored<T> | null>;
  put<T>(key: string, value: Stored<T>): Promise<void>;
}

/** 개발과 테스트용. 서버 프로세스 안에서만 유지된다. */
export function createMemoryStore(): SnapshotStore {
  const map = new Map<string, Stored<unknown>>();
  return {
    async get<T>(key: string) {
      return (map.get(key) as Stored<T> | undefined) ?? null;
    },
    async put<T>(key: string, value: Stored<T>) {
      map.set(key, value);
    },
  };
}

export type SupabaseConfig = { url: string; serviceKey: string };

/**
 * Supabase(PostgREST)에 `snapshots(key, fetched_at, data)` 표로 저장한다.
 * 표는 supabase/migrations의 SQL로 만든다.
 */
export function createSupabaseStore(
  config: SupabaseConfig,
  fetcher: typeof fetch = fetch,
): SnapshotStore {
  const headers = {
    apikey: config.serviceKey,
    Authorization: `Bearer ${config.serviceKey}`,
    "Content-Type": "application/json",
  };
  const table = `${config.url}/rest/v1/snapshots`;
  return {
    async get<T>(key: string) {
      const response = await fetcher(`${table}?key=eq.${encodeURIComponent(key)}&select=*`, {
        headers,
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Supabase ${response.status}`);
      const rows = (await response.json()) as {
        fetched_at: string;
        data: T;
      }[];
      if (rows.length === 0) return null;
      return { fetchedAt: Date.parse(rows[0].fetched_at), data: rows[0].data };
    },
    async put<T>(key: string, value: Stored<T>) {
      const response = await fetcher(`${table}?on_conflict=key`, {
        method: "POST",
        headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          key,
          fetched_at: new Date(value.fetchedAt).toISOString(),
          data: value.data,
        }),
      });
      if (!response.ok) throw new Error(`Supabase ${response.status}`);
    },
  };
}

/** 환경 변수에 Supabase 설정이 있으면 Supabase, 없으면 메모리 저장소를 쓴다. */
export function createDefaultStore(): SnapshotStore {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && serviceKey) return createSupabaseStore({ url, serviceKey });
  return createMemoryStore();
}
