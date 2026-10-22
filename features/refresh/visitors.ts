import {
  checkRefresh,
  emptyRefreshState,
  recordRefresh,
  type RefreshState,
} from "./policy";

/**
 * 방문자별 새로 고침 기록. 서버 프로세스 안에만 두므로 서버가 여러 개로 나뉘면
 * 각자 따로 센다. 첫 배포(실현 가능성 확인)에서는 이 정도로 충분하다.
 */
const globalForVisitors = globalThis as unknown as {
  presignalVisitors?: Map<string, RefreshState>;
};
const states = (globalForVisitors.presignalVisitors ??= new Map());

export function checkVisitor(id: string, now: number) {
  return checkRefresh(states.get(id) ?? emptyRefreshState, now);
}

export function recordVisitor(id: string, now: number) {
  states.set(id, recordRefresh(states.get(id) ?? emptyRefreshState, now));
}
