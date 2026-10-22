import { describe, expect, test } from "vitest";

import { checkReachability } from "@/features/sources";

describe("데이터 출처 접근 확인", () => {
  test("출처마다 HTTP 상태와 성공 여부를 돌려주고, 연결 실패도 결과로 남긴다", async () => {
    const fetcher = (async (url: string | URL | Request) => {
      const target = String(url);
      if (target.includes("gamma-api")) throw new Error("TLS handshake failed");
      if (target.includes("polymarket.com")) return new Response("", { status: 451 });
      return new Response("{}", { status: 200 });
    }) as typeof fetch;

    const results = await checkReachability(fetcher);
    const byName = Object.fromEntries(results.map((r) => [r.name, r]));

    expect(byName["Kalshi"]).toMatchObject({ ok: true, status: 200 });
    expect(byName["Polymarket Data API"]).toMatchObject({ ok: false, status: 451 });
    expect(byName["Polymarket Gamma"]).toMatchObject({ ok: false, status: null });
    expect(byName["Polymarket Gamma"].error).toContain("TLS");
  });
});
