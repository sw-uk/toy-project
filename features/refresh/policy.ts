const SEC = 1000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;

const COOLDOWN_MS = 30 * SEC;
const BURST_WINDOW_MS = 5 * MIN;
const BURST_LIMIT = 3;
const LOCK_MS = HOUR;

export type RefreshState = {
  /** 잠금 계산에 쓰는 최근 새로 고침 시각 */
  recent: number[];
  last: number;
  lockedUntil: number;
};

export const emptyRefreshState: RefreshState = {
  recent: [],
  last: 0,
  lockedUntil: 0,
};

export type RefreshCheck =
  | { allowed: true }
  | { allowed: false; reason: "cooldown" | "locked"; retryAfterMs: number };

/** 지금 새로 고칠 수 있는지 확인한다. */
export function checkRefresh(state: RefreshState, now: number): RefreshCheck {
  if (now < state.lockedUntil) {
    return {
      allowed: false,
      reason: "locked",
      retryAfterMs: state.lockedUntil - now,
    };
  }
  if (now - state.last < COOLDOWN_MS) {
    return {
      allowed: false,
      reason: "cooldown",
      retryAfterMs: COOLDOWN_MS - (now - state.last),
    };
  }
  return { allowed: true };
}

/** 새로 고침이 일어났음을 기록한다. 5분 안에 3번이면 1시간 잠근다. */
export function recordRefresh(state: RefreshState, now: number): RefreshState {
  const recent = [...state.recent, now].filter(
    (at) => now - at < BURST_WINDOW_MS,
  );
  if (recent.length >= BURST_LIMIT) {
    return { recent: [], last: now, lockedUntil: now + LOCK_MS };
  }
  return { recent, last: now, lockedUntil: state.lockedUntil };
}
