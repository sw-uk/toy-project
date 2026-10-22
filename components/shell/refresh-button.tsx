"use client";

import { Loader2Icon, RefreshCwIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/features/i18n/provider";
import {
  checkRefresh,
  emptyRefreshState,
  recordRefresh,
  type RefreshState,
} from "@/features/refresh";

const STORAGE_KEY = "presignal-refresh";

/** localStorage를 쓸 수 없을 때를 위한 메모리 대체. */
let memory = "";
const listeners = new Set<() => void>();

function readStored(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return memory;
  }
}

function writeStored(state: RefreshState) {
  const raw = JSON.stringify(state);
  memory = raw;
  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // 서버도 같은 제한을 건다
  }
  listeners.forEach((listener) => listener());
}

function subscribeStored(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function subscribeClock(listener: () => void) {
  const timer = setInterval(listener, 1000);
  return () => clearInterval(timer);
}

/** "지금 새로 고침". 30초 간격, 5분 안 3번이면 1시간 잠금. */
export function RefreshButton({ scope }: { scope: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  // 서버 렌더에서는 시각과 저장값을 모르므로 기본 상태로 그린다(0과 빈 문자열).
  const now = useSyncExternalStore(
    subscribeClock,
    () => Math.floor(Date.now() / 1000) * 1000,
    () => 0,
  );
  const stored = useSyncExternalStore(subscribeStored, readStored, () => "");
  const state = useMemo<RefreshState>(() => {
    try {
      return stored ? (JSON.parse(stored) as RefreshState) : emptyRefreshState;
    } catch {
      return emptyRefreshState;
    }
  }, [stored]);

  const check = now === 0 ? ({ allowed: true } as const) : checkRefresh(state, now);

  const onClick = useCallback(async () => {
    const at = Date.now();
    if (busy || !checkRefresh(state, at).allowed) return;
    setBusy(true);
    setFailed(false);
    try {
      const response = await fetch("/api/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope }),
      });
      if (response.status === 429) {
        // 서버가 이미 막은 경우: 서버가 알려 준 남은 시간에 맞춘다.
        const body = (await response.json()) as { retryAfterMs: number; reason: string };
        writeStored(
          body.reason === "locked"
            ? { ...state, last: at, lockedUntil: at + body.retryAfterMs }
            : { ...state, last: at - 30_000 + body.retryAfterMs },
        );
      } else if (response.ok) {
        writeStored(recordRefresh(state, at));
        router.refresh();
      } else {
        setFailed(true);
      }
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }, [busy, router, scope, state]);

  let label = t("refresh_btn");
  if (busy) label = t("refreshing_btn");
  else if (!check.allowed && check.reason === "locked") {
    label = t("refresh_locked", { m: Math.ceil(check.retryAfterMs / 60_000) });
  } else if (!check.allowed) {
    label = t("refresh_wait", { s: Math.ceil(check.retryAfterMs / 1000) });
  }

  return (
    <span className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onClick}
        disabled={busy || !check.allowed}
        aria-busy={busy}
      >
        {busy ? (
          <Loader2Icon data-icon="inline-start" className="animate-spin" />
        ) : (
          <RefreshCwIcon data-icon="inline-start" />
        )}
        {label}
      </Button>
      {!check.allowed && check.reason === "locked" ? (
        <span className="text-xs text-muted-foreground">{t("refresh_limit_note")}</span>
      ) : null}
      {failed ? <span className="text-xs text-destructive">{t("refresh_failed")}</span> : null}
    </span>
  );
}
