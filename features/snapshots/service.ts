import { buildEvent } from "./build-event";
import { buildHome } from "./build-home";
import { buildRatesHistory, buildRatesLive } from "./build-rates";
import { loadSnapshot, type Loaded } from "./load";
import { createDefaultStore, type SnapshotStore } from "./store";
import type { EventDetail, HomeData, RatesHistory, RatesLive } from "./types";

const globalForStore = globalThis as unknown as { presignalStore?: SnapshotStore };
function store(): SnapshotStore {
  globalForStore.presignalStore ??= createDefaultStore();
  return globalForStore.presignalStore;
}

export type RatesView = { live: Loaded<RatesLive>; history: Loaded<RatesHistory> };

export async function getRates(now = Date.now(), force = false): Promise<RatesView> {
  const live = await loadSnapshot<RatesLive>(
    store(),
    "rates:live",
    (previous) => buildRatesLive(now, previous),
    { now, eventAt: (saved) => saved?.nextMeetingAt ?? null, force },
  );
  // 지난 회의 이력은 새 회의가 끝날 때만 바뀌므로 하루에 한 번만 새로 만든다.
  const history = await loadSnapshot<RatesHistory>(store(), "rates:history", () => buildRatesHistory(), {
    now,
    eventAt: null,
    force: false,
  });
  return { live, history };
}

export async function getHome(now = Date.now(), force = false): Promise<Loaded<HomeData>> {
  const rates = await getRates(now, force);
  return loadSnapshot<HomeData>(
    store(),
    "home",
    () => buildHome(now, { live: rates.live.data, history: rates.history.data }),
    { now, eventAt: (saved) => saved?.nextEventAt ?? null, force },
  );
}

export async function getEvent(
  id: string,
  now = Date.now(),
  force = false,
): Promise<Loaded<EventDetail>> {
  return loadSnapshot<EventDetail>(store(), `event:${id}`, () => buildEvent(id, now), {
    now,
    eventAt: (saved) => (saved && saved.status === "open" ? saved.announcementAt : null),
    force,
  });
}

/** 방문자가 직접 새로 고쳤을 때 해당 화면의 데이터를 강제로 새로 만든다. */
export async function refreshScope(scope: string, now = Date.now()) {
  if (scope === "home") return (await getHome(now, true)).fetchedAt;
  if (scope === "rates") return (await getRates(now, true)).live.fetchedAt;
  if (scope.startsWith("event:")) return (await getEvent(scope.slice(6), now, true)).fetchedAt;
  throw new Error(`unknown scope ${scope}`);
}
