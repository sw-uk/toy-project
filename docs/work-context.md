# PreSignal 작업 맥락

2026-10-22 세션까지의 작업 내용을 다음 세션이 이어받을 수 있도록 정리한 문서입니다. 제품 방향의 기준은 [PRODUCT.md](../PRODUCT.md), 구현할 동작의 기준은 [spec.md](specs/presignal-mvp/spec.md)입니다. 이 문서는 그 둘이 담지 않는 경과와 근거, 남은 일을 적습니다.

## 한눈에 보기

- **무엇을 만드나:** 예측시장(Kalshi, Polymarket)의 확률과 거래 기록을 일반인이 로그인 없이 보는 사이트 PreSignal입니다. 연준 금리 결정 앞의 판단 참고, 뉴스 속 이벤트 직전의 눈에 띄는 베팅 확인이 두 축입니다.
- **지금 단계:** 제품 정의(PRODUCT.md)와 스펙(docs/specs/presignal-mvp)이 끝났고, 구현은 시작하지 않았습니다. 승인된 프로토타입이 스펙 폴더에 있습니다.
- **다음 단계:** 서브에이전트가 측정 중인 큰 베팅 기준을 확정한 뒤 `implement` 스킬로 구현을 시작합니다.

## 경과

1. **환경 준비:** `bun install`로 의존성을 설치하고 개발 서버를 띄웠습니다(3000번이 사용 중이라 3001번). shadcn 프리셋을 `vega`에서 `b0`(`nova`)로 Overwrite 방식으로 적용했습니다.
2. **자료 검증:** 처음 받은 정보를 공식 문서와 웹 검색으로 검증했습니다. 정치 배경(상원 금지 규칙, Van Dyke 기소)은 대체로 사실이었고, API 설명은 엔드포인트와 파라미터가 여러 군데 틀렸습니다.
3. **호출 테스트:** 이 PC(한국 IP)에서는 Polymarket 공식 API가 HTTP 451로 막혀 있었습니다. 막히지 않는 경로를 찾아 [api-availability-report.md](api-availability-report.md)에 정리했습니다.
4. **제품 정의:** `/define-product` 인터뷰로 PRODUCT.md를 작성했습니다. 제품 이름은 PreSignal(프리시그널)입니다.
5. **스펙 작성:** `shape-idea`로 진행했습니다. Vercel, Supabase 공식 스킬을 설치하고, `build-prototype`으로 화면을 만들어 승인받은 뒤 스펙을 썼습니다.
6. **스펙 수정:** 확률 구간 이름, 의외의 결과 기준, 새로 고침 제한, 기본 언어를 반영했고 GLOSSARY.md를 추가했습니다.

## 확인된 데이터 사실

### 막힌 것
- Polymarket Gamma, Data v1/v2, CLOB, 웹: HTTP 451 또는 TLS 실패. 우회는 시도하지 않았습니다.
- 서드파티 인덱서(Goldsky, Dune, Allium)는 계정이 필요합니다. Goldsky는 V2 전환(2026-04-28) 이후 공개 서브그래프가 부정확하다고 안내합니다.
- Data API v1은 2026-10-24에 종료됩니다.

### 쓸 수 있는 것
- **Kalshi 공개 API:** `https://api.elections.kalshi.com/trade-api/v2`. 시장, 이벤트, 체결, 오더북, 해소된 시장(`/markets?status=settled`), 2026-08-22 이전 이력(`/historical/markets`)과 일봉 캔들. 유저 식별 정보는 없습니다.
  - 과거 캔들 필드는 `price.close`, 현행 캔들은 `price.close_dollars`로 이름이 다릅니다.
  - 마지막 체결가로 구한 선택지 확률은 합이 100%가 아닌 경우가 있습니다.
- **연준 금리 시장:** `KXFEDDECISION`. 2023년부터 28회 결과와 확률 이력을 얻습니다. 회의 하루 전 확률 기준으로 실제 결과가 된 선택지의 확률은 최저 0.59, 중앙값 0.98이었습니다. 하루 전 기준으로는 의외의 결과가 거의 없습니다.
- **뉴욕 연준 실효금리:** `markets.newyorkfed.org/api/rates/unsecured/effr/search.json`. 키 없이 1년치 250건을 받았습니다. FRED는 점검 중이었습니다.
- **Polygon 공개 RPC:** `https://1rpc.io/matic`(조회 범위 50블록), `https://polygon.drpc.org`(100블록 가능, 500블록부터 HTTP 400). Polymarket 거래소의 `OrderFilled` 로그를 읽습니다.

### 온체인 디코딩 검증 결과
- `OrderFilled` 시그니처의 keccak256이 로그의 `topic0`(`0xd543adfd...84d8ee`)과 일치합니다.
- `side`: 0은 매수, 1은 매도입니다.
- 가격: 매수는 `makerAmountFilled / takerAmountFilled`, 매도는 `takerAmountFilled / makerAmountFilled`입니다. 최근 100블록 4,697건이 모두 0~1 범위였습니다.
- 100블록당 약 4,700건(하루 약 200만 건)이라 전체 기간 지갑 수익 랭킹은 무료 RPC로 계산할 수 없습니다. 이벤트 전후 몇 시간 창은 가능합니다.
- taker의 약 39%는 지갑이 아니라 거래소 컨트랙트로 기록됩니다.
- 거래소 주소: CTF Exchange `0xE111180000d2663C0091e4f400237545B87B996B`, Neg Risk `0xe2222d279d744050d28e00520010520000310F59`, ExchangeV3 Poly v2 `0xe3333700cA9d93003F00f0F71f8515005F6c00Aa`.
- 토큰 ID에서 시장 제목을 찾으려면 Gamma가 필요한데 막혀 있습니다.

## 제품 결정 요약

- 사용자는 미국, 한국, 영국의 일반인입니다. 로그인, 알림, 거래 연동, 후속 시나리오는 없습니다.
- 금리: 다음 회의의 인상 확률이 중심이고(동결·인하는 펼쳐 보기), 정기예금·미국채·변동금리 대출에 대한 "시점 안내"를 줍니다. 투자 권유가 아니라는 고지가 최우선 UX 원칙입니다.
- 눈에 띄는 베팅: 개별 이벤트의 "누가 얼마를 벌었나"만 다룹니다. 전체 기간 상위 수익자 순위는 하지 않습니다. 금리 결정에는 적용하지 않습니다.
- 공개와 표현의 선은 [data-disclosure](decisions/data-disclosure.md)에 있습니다. 지갑은 익명 주소 그대로 공개하되 실명과 연결하지 않고, 내부자 거래를 단정하지 않습니다.
- 확률 구간 이름: 60% 이상 "가능성 큼", 40~59% "뚜렷한 신호 없음", 40% 미만 "가능성 낮음", 5% 미만 "이례적", 1% 미만 "매우 이례적".
- 의외의 결과: 한 달 전 확률 10% 미만이었는데 일어난 결과(제가 정한 가정).
- 갱신 주기: 이벤트 7일 전까지 하루 1회, 3일 전까지 12시간마다, 이후 1시간마다.
- 새로 고침: 30초 뒤부터 가능, 5분 안에 3번이면 1시간 잠금.
- 기본 언어는 미국 영어이고 한국어, 영국 영어를 선택할 수 있습니다.
- 배포는 Vercel에 도메인 없이 올리는 테스트 실습입니다. 화면은 Supabase에 저장한 최신 데이터를 보여 줍니다.

## 용어

용어와 피해야 할 표현은 [GLOSSARY.md](../GLOSSARY.md)에 있습니다. 이 프로젝트에서는 "사건" 대신 "이벤트", "수상한 베팅·이상 거래" 대신 "눈에 띄는 베팅", "추천" 대신 "시점 안내"를 씁니다.

## 이 세션에서 바꾼 파일

- 새 문서: PRODUCT.md, GLOSSARY.md, docs/api-availability-report.md, docs/work-context.md, docs/decisions/data-disclosure.md, docs/specs/presignal-mvp/(spec.md, prototype.html)
- 수정: docs/decisions/README.md(색인), AGENTS.md(Vercel, Supabase 최신 문서 안내), skills-lock.json
- 설치한 스킬(`.agents/skills`, `.claude/skills` 양쪽): deploy-to-vercel, supabase, supabase-postgres-best-practices
- shadcn 프리셋 적용으로 바뀐 파일: components.json, app/globals.css, components/ui/button.tsx, lib/utils.ts, package.json, bun.lock
- `.claude/launch.json`: 개발 서버(`dev`)와 프로토타입(`prototype`, 4173번) 실행 설정

## 미해결 항목

1. **큰 베팅 기준:** 사용자는 1만 달러 이상, 발표 6시간 이내를 원했고, 데이터 취득 한계에 걸리면 2.5만 달러 이상, 3시간 이내를 유지하라고 했습니다. 서브에이전트가 이 PC에서 3시간·6시간 창 스캔을 측정하고 있습니다. 판정 기준은 "무료 RPC 한 곳에서 6시간 창 스캔이 영구 실패 없이 순차로 10분 안에 끝나는가"입니다. 결과가 나오기 전까지 스펙은 2.5만 달러 이상, 3시간 이내로 적혀 있습니다.
2. **Polymarket 접근:** Vercel 환경에서 읽을 수 있는지 첫 배포에서 확인해야 합니다. 그 전까지 눈에 띄는 베팅 화면은 "지갑 정보 없음" 임시 동작을 합니다.
3. **시장 제목 출처:** 온체인 로그에는 토큰 ID만 있어 제목을 얻을 출처가 정해지지 않았습니다.
4. **taker 지갑 귀속:** 지갑별 정확한 귀속 방법이 정해지지 않았습니다.
5. **기본값 가정:** 의외의 결과 10% 기준, 확률 구간 이름의 적용 위치, 확률 합 100% 보정은 사용자가 확정하지 않은 가정입니다.
6. **프로토타입:** 금리와 이벤트 상세 화면의 390px 폭은 직접 확인하지 못했습니다.
7. **전역 설정 설치:** Vercel 플러그인, Vercel MCP, Supabase 플러그인은 사용자 전역 설정을 바꾸므로 설치하지 않았습니다.
8. **배포 인증:** Vercel 로그인은 사용자가 직접 해야 합니다.

## 프로젝트 규칙 중 이번에 영향을 준 것

- 모든 대화와 커밋 메시지는 한글로 씁니다(AGENTS.md).
- 일반 UI는 공식 shadcn 구성을 쓰고 토큰·variant를 하나로 유지합니다(decisions/ui-composition.md).
- 자동 코드 리뷰는 최대 1회, 가장 낮은 강도로만 합니다. 스펙이 요구하지 않은 보안 하드닝과 성능 방어는 범위 밖입니다.
- 런타임 검증은 `next-dev-loop` 스킬로 합니다.
