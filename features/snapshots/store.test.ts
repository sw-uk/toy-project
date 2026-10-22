import { describe, expect, test, vi } from "vitest";

import { createMemoryStore, createSupabaseStore } from "@/features/snapshots";

describe("메모리 저장소", () => {
  test("저장한 스냅샷을 같은 키로 읽고, 없는 키는 null이다", async () => {
    const store = createMemoryStore();
    await store.put("rates", { fetchedAt: 1000, data: { rise: 12 } });

    expect(await store.get("rates")).toEqual({ fetchedAt: 1000, data: { rise: 12 } });
    expect(await store.get("missing")).toBeNull();
  });
});

describe("Supabase 저장소", () => {
  test("키를 upsert로 저장하고 같은 키로 읽는다", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetcher = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} });
      if (init?.method === "POST") return new Response(null, { status: 201 });
      return Response.json([
        { key: "rates", fetched_at: "2026-10-22T09:00:00.000Z", data: { rise: 12 } },
      ]);
    });
    const store = createSupabaseStore(
      { url: "https://example.supabase.co", serviceKey: "service-key" },
      fetcher as unknown as typeof fetch,
    );

    await store.put("rates", { fetchedAt: Date.UTC(2026, 9, 22, 9), data: { rise: 12 } });
    const read = await store.get("rates");

    expect(calls[0].url).toBe("https://example.supabase.co/rest/v1/snapshots?on_conflict=key");
    expect(calls[0].init.method).toBe("POST");
    expect(JSON.parse(String(calls[0].init.body))).toEqual({
      key: "rates",
      fetched_at: "2026-10-22T09:00:00.000Z",
      data: { rise: 12 },
    });
    expect((calls[0].init.headers as Record<string, string>).Prefer).toContain(
      "resolution=merge-duplicates",
    );
    expect(calls[1].url).toBe("https://example.supabase.co/rest/v1/snapshots?key=eq.rates&select=*");
    expect(read).toEqual({ fetchedAt: Date.UTC(2026, 9, 22, 9), data: { rise: 12 } });
  });
});
