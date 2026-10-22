import { isStale } from "@/features/refresh";

import type { SnapshotStore } from "./store";

export type Loaded<T> = {
  fetchedAt: number;
  data: T;
  /** 새로 만들기에 실패해 마지막 저장본을 보여 주는 중인지 */
  failed: boolean;
};

export type LoadOptions<T> = {
  now: number;
  /** 갱신 주기를 정하는 이벤트 시각. 저장된 데이터에서 읽을 수도 있다. */
  eventAt: number | null | ((saved: T | null) => number | null);
  /** 사용자가 직접 새로 고친 경우 */
  force?: boolean;
};

/**
 * 저장된 데이터가 최신이면 그대로, 낡았거나 없으면 새로 만들어 저장한다.
 * 새로 만들기에 실패하면 마지막 저장본을 실패 표시와 함께 돌려준다.
 */
export async function loadSnapshot<T>(
  store: SnapshotStore,
  key: string,
  build: (previous: T | null) => Promise<T>,
  options: LoadOptions<T>,
): Promise<Loaded<T>> {
  const saved = await store.get<T>(key);
  const eventAt =
    typeof options.eventAt === "function"
      ? options.eventAt(saved?.data ?? null)
      : options.eventAt;

  if (saved && !options.force && !isStale(saved.fetchedAt, options.now, eventAt)) {
    return { ...saved, failed: false };
  }

  try {
    const data = await build(saved?.data ?? null);
    await store.put(key, { fetchedAt: options.now, data });
    return { fetchedAt: options.now, data, failed: false };
  } catch (error) {
    if (saved) return { ...saved, failed: true };
    throw error;
  }
}
