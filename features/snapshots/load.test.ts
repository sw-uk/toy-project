import { describe, expect, test, vi } from "vitest";

import { createMemoryStore, loadSnapshot } from "@/features/snapshots";

const HOUR = 3_600_000;
const eventAt = Date.UTC(2026, 9, 28, 18); // 갱신 주기를 1시간으로 만드는 시점에 맞춰 now를 둔다
const now = eventAt - 2 * 24 * HOUR;

describe("저장된 데이터 불러오기", () => {
  test("저장된 데이터가 최신이면 새로 만들지 않고 그대로 돌려준다", async () => {
    const store = createMemoryStore();
    await store.put("k", { fetchedAt: now - 30 * 60_000, data: "saved" });
    const build = vi.fn(async () => "new");

    const result = await loadSnapshot(store, "k", build, { now, eventAt });

    expect(result).toEqual({ fetchedAt: now - 30 * 60_000, data: "saved", failed: false });
    expect(build).not.toHaveBeenCalled();
  });

  test("낡았거나 없으면 새로 만들어 저장한다", async () => {
    const store = createMemoryStore();
    const build = vi.fn(async () => "new");

    const first = await loadSnapshot(store, "k", build, { now, eventAt });
    expect(first).toEqual({ fetchedAt: now, data: "new", failed: false });

    await store.put("k", { fetchedAt: now - 2 * HOUR, data: "old" });
    const second = await loadSnapshot(store, "k", build, { now, eventAt });
    expect(second.data).toBe("new");
    expect(await store.get("k")).toEqual({ fetchedAt: now, data: "new" });
  });

  test("강제로 새로 고치면 최신이어도 다시 만든다", async () => {
    const store = createMemoryStore();
    await store.put("k", { fetchedAt: now - 1000, data: "saved" });

    const result = await loadSnapshot(store, "k", async () => "forced", {
      now,
      eventAt,
      force: true,
    });

    expect(result.data).toBe("forced");
  });

  test("새로 만들기에 실패하면 마지막으로 저장된 데이터를 실패 표시와 함께 돌려준다", async () => {
    const store = createMemoryStore();
    await store.put("k", { fetchedAt: now - 3 * HOUR, data: "saved" });

    const result = await loadSnapshot(
      store,
      "k",
      async () => {
        throw new Error("Kalshi 500");
      },
      { now, eventAt },
    );

    expect(result).toEqual({ fetchedAt: now - 3 * HOUR, data: "saved", failed: true });
  });

  test("저장된 데이터가 없는데 만들기도 실패하면 오류를 그대로 던진다", async () => {
    await expect(
      loadSnapshot(
        createMemoryStore(),
        "k",
        async () => {
          throw new Error("Kalshi 500");
        },
        { now, eventAt },
      ),
    ).rejects.toThrow("Kalshi 500");
  });
});
