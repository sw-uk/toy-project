# 마감 시각이 없는 Kalshi 이벤트에서 상세 화면 오류 가능성

- 증상(리뷰 지적, 재현 안 됨): 모든 시장에 `close_time`이 없으면 `features/snapshots/build-event.ts`의 `announcementAt`이 `Infinity`가 되어 날짜 표기에서 RangeError가 날 수 있다.
- 근거: `Math.min()`에 빈 배열이 들어가는 경로. 실측한 Kalshi 이벤트는 모두 `close_time`이 있었다.
- 다음 단계: `closes`가 비면 이벤트를 404로 처리하거나 마감 시각 없이 표시한다.
