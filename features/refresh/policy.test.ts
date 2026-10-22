import { describe, expect, test } from "vitest";

import {
  checkRefresh,
  emptyRefreshState,
  recordRefresh,
} from "@/features/refresh";

const SEC = 1000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const t0 = Date.UTC(2026, 9, 22, 9, 0, 0);

describe("새로 고침 제한", () => {
  test("처음에는 바로 새로 고칠 수 있다", () => {
    expect(checkRefresh(emptyRefreshState, t0)).toEqual({ allowed: true });
  });

  test("직전 새로 고침 30초 뒤부터 가능하고 그 전에는 남은 시간을 알려 준다", () => {
    const state = recordRefresh(emptyRefreshState, t0);

    expect(checkRefresh(state, t0 + 29 * SEC)).toEqual({
      allowed: false,
      reason: "cooldown",
      retryAfterMs: 1 * SEC,
    });
    expect(checkRefresh(state, t0 + 30 * SEC)).toEqual({ allowed: true });
  });

  test("5분 안에 3번 새로 고치면 1시간 동안 막힌다", () => {
    let state = recordRefresh(emptyRefreshState, t0);
    state = recordRefresh(state, t0 + 31 * SEC);
    state = recordRefresh(state, t0 + 62 * SEC);

    expect(checkRefresh(state, t0 + 100 * SEC)).toEqual({
      allowed: false,
      reason: "locked",
      retryAfterMs: 62 * SEC + HOUR - 100 * SEC,
    });
    expect(checkRefresh(state, t0 + 62 * SEC + HOUR)).toEqual({ allowed: true });
  });

  test("5분이 넘게 떨어진 새로 고침은 잠금에 쌓이지 않는다", () => {
    let state = recordRefresh(emptyRefreshState, t0);
    state = recordRefresh(state, t0 + 2 * MIN);
    state = recordRefresh(state, t0 + 5 * MIN + 10 * SEC);

    expect(checkRefresh(state, t0 + 6 * MIN)).toEqual({ allowed: true });
  });
});
