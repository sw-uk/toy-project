# 예측시장 API 가용성 및 호출 테스트 리포트

- 테스트 일시: 2026-10-22 (UTC 02:20대)
- 테스트 환경: 개발 PC (Windows 11, `curl` / `python urllib`), 공인 IP 기준 국가 **South Korea (KR)** (`ip-api.com` 응답)
- 목적: 이 환경에서 막히지 않고 정상 응답을 주는 예측시장 관련 API와 엔드포인트를 확인하고, 샘플 호출로 응답 구조를 검증한다.
- 인증: 모든 테스트는 **API 키 없이** 수행했다.

---

## 1. 요약

| 구분 | 결과 |
|---|---|
| Polymarket 공식 API (Gamma / Data / CLOB / 웹) | **이 환경에서 사용 불가.** HTTP 451, Gamma는 TLS 핸드셰이크 실패 |
| Polymarket 문서 사이트 (`docs.polymarket.com`) | 사용 가능 (HTTP 200) |
| **Kalshi 공개 API** | **사용 가능.** 시장·이벤트·체결·오더북 조회 정상 |
| **Polygon 온체인 데이터 (공개 RPC)** | **사용 가능.** Polymarket 거래소 컨트랙트 로그를 지갑 주소 단위로 조회 가능 |
| Manifold Markets API | 사용 가능 (플레이머니 시장이라 실제 정치·내부자 분석용으로는 부적합) |

핵심 결론:

1. Polymarket 공식 API는 이 PC에서 쓸 수 없다. 개발 중 실제 응답으로 스키마를 확정할 수 없다.
2. **지갑 단위 분석(베팅 시각, 참여 횟수, 상위 수익 유저)이 필요하면 Polygon 온체인 로그가 현재 환경에서 가능한 유일한 경로다.** 수익(PnL) 랭킹은 직접 계산해야 한다.
3. Kalshi는 **유저 식별 정보가 전혀 없다.** 시장 단위 이상 거래 시각 분석(체결 시각·수량·방향)만 가능하다.

---

## 2. 도달성 점검 전체 결과

| 대상 | URL | HTTP | 판정 |
|---|---|---|---|
| Polymarket Gamma | `gamma-api.polymarket.com/events?limit=1` | 000 (TLS 핸드셰이크 실패) | 불가 |
| Polymarket Data v1 | `data-api.polymarket.com/trades?limit=1` | 451 | 불가 |
| Polymarket Data v2 | `data-api.polymarket.com/v2/trades?limit=1` | 451 | 불가 |
| Polymarket Data v2 leaderboard | `data-api.polymarket.com/v2/leaderboard?...` | 451 (`error code: 1026`) | 불가 |
| Polymarket CLOB | `clob.polymarket.com/time` | 451 | 불가 |
| Polymarket 웹 / geoblock | `polymarket.com/`, `polymarket.com/api/geoblock` | 451 | 불가 |
| Polymarket WS 스펙 | `ws-live-v2.polymarket.com/asyncapi.json` | 000 | 불가 |
| Polymarket 문서 | `docs.polymarket.com/` | 200 | 가능 |
| **Kalshi** | `api.elections.kalshi.com/trade-api/v2/...` | 200 | **가능** |
| Manifold | `api.manifold.markets/v0/...` | 200 | 가능 (참고용) |
| Metaculus | `metaculus.com/api/posts/` | 403 | 불가 |
| 의원 주식거래 S3 (senate/house stock watcher) | `*-stock-watcher-data.s3...` | 403 | 불가 |
| FEC | `api.open.fec.gov/v1/` | 403 (키 없음 추정) | 미확인 |
| `polygon-rpc.com` | JSON-RPC | 403 `API key disabled` | 불가 |
| `rpc.ankr.com/polygon` | JSON-RPC | 인증 필요 | 불가 |
| `polygon-bor-rpc.publicnode.com`, `polygon.llamarpc.com`, `polygon-mainnet.public.blastapi.io`, `polygon.meowrpc.com` | JSON-RPC | 응답 없음 | 불가 |
| **`1rpc.io/matic`** | JSON-RPC | 200 | **가능** |
| **`polygon.drpc.org`** | JSON-RPC | 200 | **가능** |
| GitHub API / raw (컨트랙트 소스 조회) | `api.github.com`, `raw.githubusercontent.com` | 200 | 가능 |

> Polymarket 451은 지역 제한(geoblock)으로 보인다. 이 PC의 IP가 대한민국으로 인식된다는 점과 일치하지만, 차단 사유를 Polymarket이 직접 밝힌 것은 아니다. 우회는 시도하지 않았다.

---

## 3. 사용 가능한 API와 엔드포인트

### 3-1. Kalshi 공개 API

- Base URL: `https://api.elections.kalshi.com/trade-api/v2`
- 인증: 시장 데이터 조회는 불필요. `portfolio/*`는 인증 필요 (`/portfolio/balance` → HTTP 401 `token_authentication_failure`).
- 페이지네이션: 응답의 `cursor` 값을 다음 요청에 전달한다.

| 엔드포인트 | 용도 | 테스트 |
|---|---|---|
| `GET /exchange/status` | 거래소 상태 | 200 |
| `GET /exchange/schedule` | 운영 시간 | 200 |
| `GET /events?limit=&status=open` | 이벤트 목록 | 200 |
| `GET /series?limit=` | 시리즈 목록 | 200 |
| `GET /markets?limit=&status=open` | 시장 목록 | 200 |
| `GET /markets/{ticker}` | 시장 상세 | 200 |
| `GET /markets/{ticker}/orderbook` | 오더북 | 200 |
| `GET /markets/trades?limit=&ticker=&min_ts=&max_ts=` | 공개 체결 내역 | 200 (`min_ts`/`max_ts` 필터 정상 동작) |

Kalshi 체결(trade) 응답 필드 (실제 응답에서 확인):

```json
{
  "trade_id": "0724e4cf-bae1-adde-1874-a69334960401",
  "ticker": "KXSOL15M-26OCT212230-30",
  "created_time": "2026-10-22T02:22:50.024602Z",
  "count_fp": "1.00",
  "yes_price_dollars": "0.0110",
  "no_price_dollars": "0.9890",
  "taker_side": "no",
  "taker_outcome_side": "no",
  "taker_book_side": "ask",
  "is_block_trade": false
}
```

- 시각은 **ISO 8601 UTC(마이크로초)**, 가격과 수량은 **문자열**이다 (숫자 변환 필요).
- **계정·지갑 식별자 필드가 없다.** 상위 수익 유저, 참여 횟수 분석은 불가.
- 이벤트 카테고리 분포 (open 이벤트 200건 표본): Economics 57, Sports 51, **Politics 21**, Science and Technology 19, Entertainment 18, **Elections 16**, Climate and Weather 8, Financials 7, Health 2, Companies 1.

### 3-2. Polygon 온체인 (Polymarket 거래소 컨트랙트)

- 접속: 공개 JSON-RPC `https://1rpc.io/matic`, `https://polygon.drpc.org` (둘 다 키 없이 응답, 서로 교차 확인됨)
- 컨트랙트 주소 (`docs.polymarket.com/resources/contracts.md` 기준, Polygon chain ID 137):
  - CTF Exchange: `0xE111180000d2663C0091e4f400237545B87B996B`
  - Neg Risk CTF Exchange: `0xe2222d279d744050d28e00520010520000310F59`
  - pUSD: `0xC011a7E12a19f7B1f670d46F03B03f3342E82DFB`
- 사용 메서드: `eth_blockNumber`, `eth_getLogs`, `eth_getBlockByNumber`

`OrderFilled` 이벤트 시그니처 (`Polymarket/ctf-exchange-v2` 소스, `ITrading.sol`):

```solidity
event OrderFilled(
    bytes32 indexed orderHash,
    address indexed maker,
    address indexed taker,
    Side side,
    uint256 tokenId,
    uint256 makerAmountFilled,
    uint256 takerAmountFilled,
    uint256 fee,
    bytes32 builder,
    bytes32 metadata
);
```

---

## 4. 샘플 호출 테스트 결과

### 4-1. Polygon 온체인 `eth_getLogs` (최근 구간)

- 현재 블록: 약 `0x5b822b4` (95,953,6xx)
- 최근 **50블록** 구간 로그 수: CTF Exchange 약 5,640건, Neg Risk Exchange 약 1,070~1,090건 (두 RPC가 근사하게 일치)
- 최근 **20블록** 구간: CTF Exchange 2,086건
- 로그 구조: `topics` 4개 + `data` 450 hex 문자(7워드). 소스의 `OrderFilled` 레이아웃(indexed 3개 + 비인덱스 7개)과 일치한다.

디코딩 샘플 1건 (`data`를 7워드로 분리, USDC 계열 6자리 소수 적용):

| 필드 | 값 |
|---|---|
| block | 95953607 |
| 시각 (UTC, 블록 타임스탬프) | 2026-10-22T02:22:59Z |
| maker | `0x6f677e4c493cbd2184fcf90f855fe07087008d70` |
| taker | `0xa948ef66b7fdc109111dec1dc150c6b071e693c6` |
| side | 1 |
| tokenId | `53655650322289...` (앞부분만 표기) |
| makerAmountFilled | 22.857143 |
| takerAmountFilled | 4.8 |
| fee | 0.0 |

확인된 사실:
- **지갑 주소(maker/taker), 체결 시각(블록 타임스탬프, 초 단위), 토큰 ID, 금액**을 키 없이 얻을 수 있다.

주의사항 (확인된 문제와 미확인 사항):
- 같은 컨트랙트 로그에 **다른 이벤트 타입이 섞여 있다.** 두 번째 로그를 같은 방식으로 디코딩하자 데이터 길이가 달라 실패했다. `topic0`으로 `OrderFilled`만 걸러야 한다.
- 첫 로그의 `topic0`은 `0xd543adfd945773f1a62f74f0ee55a5e3b9b1a28262980ba90b1a89f2ea84d8ee`다. 디코딩 구조가 일치하는 점으로 `OrderFilled`로 판단했으나, **keccak256 해시로 시그니처를 직접 대조하지는 못했다** (이 PC에 keccak 라이브러리가 없었다). 구현 시 ABI 라이브러리로 확인해야 한다.
- `side` 값 1이 BUY인지 SELL인지는 `Side` enum 정의를 확인하지 않았다.
- `makerAmountFilled`/`takerAmountFilled`가 어느 쪽이 pUSD이고 어느 쪽이 포지션 토큰인지는 `side`에 따라 달라지므로, 가격과 수량 계산 규칙을 별도로 검증해야 한다.
- `tokenId`를 시장(condition)·질문 제목으로 매핑하는 방법은 Gamma API가 필요한데 이 환경에서 막혀 있다. 온체인(CTF 컨트랙트)이나 다른 환경에서 매핑 테이블을 구해야 한다.
- 공개 RPC는 `eth_getLogs` 범위·속도 제한이 있을 수 있다. 이번에는 50블록(약 2분)까지만 시험했다. 장기 이력 수집에는 부적합하며, 별도 인덱서나 유료 노드가 필요할 가능성이 높다.

### 4-2. Kalshi

- `GET /markets/trades?limit=3` → 200, 체결 3건 정상 (필드는 3-1 참고)
- `GET /markets/trades?ticker=KXSOL15M-26OCT212230-30&limit=2` → 200
- `GET /markets/trades?min_ts=1792600000&max_ts=1792635000&limit=1` → 200 (시간 범위 필터 동작)
- `GET /markets/{ticker}/orderbook` → 200, 필드 `orderbook_fp.no_dollars` 등 `[가격, 수량]` 배열 (문자열)
- `GET /markets?limit=2&status=open` → 200 (조합 시장 `KXMVE...`의 `mve_selected_legs` 등 포함)

### 4-3. Manifold (참고)

- `GET /v0/markets?limit=1`, `GET /v0/bets?limit=2` → 200. 베팅에 `userId`와 `createdTime`(밀리초)이 포함된다.
- 플레이머니(가상 화폐) 플랫폼이므로 실제 자금이 오가는 내부자 거래 분석에는 쓸 수 없다. UI 프로토타입용 샘플 데이터 정도로만 적합하다.

---

## 5. 요구 데이터별 현재 환경 가능 여부

| 요구 데이터 | Polymarket 공식 API | Polygon 온체인 | Kalshi |
|---|---|---|---|
| 베팅 시각 | 불가 (차단) | **가능** (블록 타임스탬프, 초 단위) | **가능** (ISO 마이크로초, 시장 단위) |
| 지갑·유저 식별 | 불가 | **가능** (maker/taker 주소) | **불가** (식별자 없음) |
| 참여 횟수·거래 빈도 | 불가 | **가능** (직접 집계) | 불가 |
| 상위 수익(PnL) 유저 | 불가 (`/v2/leaderboard` 451) | 직접 계산 필요 (매수·매도·정산 이벤트 전체 필요, 난이도 높음) | 불가 |
| 시장 제목·카테고리 | 불가 (Gamma 차단) | 불가 (tokenId만 있음) | **가능** (`events`, `series`, `markets`) |
| 실시간 스트림 | 불가 | RPC 폴링으로 근사 | 미확인 (WebSocket은 이번에 시험하지 않음) |

---

## 6. 구현 시 권고

1. **Polymarket 공식 API 기반 설계는 이 PC에서 검증할 수 없다.** 응답 필드(`proxy_wallet`, PnL 필드명, `/v2/trades` 타임스탬프 단위)는 미확인 상태이므로, 배포 환경에서 호출이 되는지 먼저 확인해야 한다.
2. 이 환경에서 개발을 진행해야 한다면:
   - 시장 단위 이상 거래 시각 분석 → **Kalshi** 데이터로 실제 응답 기반 구현
   - 지갑 단위 활동 분석 → **Polygon 온체인 `OrderFilled`** 기반 구현 (이벤트 필터링, 가격 계산 규칙, tokenId 매핑을 먼저 검증)
   - 상위 수익 유저 랭킹 → 이 환경에서는 신뢰할 만한 값을 얻기 어려우므로 목업 데이터로 UI를 만들고 후속 검증
3. API 호출은 브라우저가 아닌 **서버(Next.js route handler)**에서 수행하고, 응답을 캐싱한다.
4. 특정 지갑을 "내부자"로 단정하는 표현은 쓰지 않는다. "이벤트 직전 대규모 유입 패턴" 같은 객관적 지표와 면책 문구를 쓴다.

## 7. 한계 (이 리포트가 확인하지 못한 것)

- Polymarket 공식 API의 실제 응답은 한 번도 받지 못했다. 관련 필드와 제한 수치는 공식 문서 기준이며 호출로 검증되지 않았다.
- `topic0` 해시 대조, `side` enum 의미, 금액으로부터의 가격 계산, 장기 구간 `eth_getLogs` 한도는 확인하지 않았다.
- Kalshi WebSocket, 속도 제한 수치, 정치 카테고리 시장의 실제 체결 샘플은 확인하지 않았다.
- 단일 시점(약 2분 구간)의 샘플이므로 응답 시간과 안정성은 평가하지 않았다.

---

## 8. 추가 검증 (Unknown 해소용, 2026-10-22)

### 8-1. Polymarket 온체인 디코딩 검증 완료
- `OrderFilled` 시그니처 `OrderFilled(bytes32,address,address,uint8,uint256,uint256,uint256,uint256,bytes32,bytes32)`의 keccak256을 직접 계산한 결과가 로그의 `topic0`(`0xd543adfd...84d8ee`)과 일치한다. (계산기 정확성은 빈 문자열과 `Transfer` 해시로 교차 확인)
- `side`: 0 = BUY, 1 = SELL (`ctf-exchange-v2` 소스의 `enum Side`).
- 가격 규칙: BUY는 `makerAmountFilled(pUSD) / takerAmountFilled(토큰)`, SELL은 `takerAmountFilled(pUSD) / makerAmountFilled(토큰)`. 최근 100블록의 `OrderFilled` 4,697건 전부가 (0, 1] 범위에 들어갔고, 반대 규칙은 4,697건 전부 위반했다.
- 같은 컨트랙트에는 다른 이벤트 타입(`topic0` 0x174b..., 0x55bb...)이 섞여 있어 `topic0` 필터가 필요하다.
- V2 컨트랙트 `ExchangeV3 Poly v2`(`0xe3333700...`)도 같은 `OrderFilled` 이벤트를 낸다(100블록당 40건, 규모는 작음). `PositionManager`는 `OrderFilled`를 내지 않는다.

### 8-2. 무료 공개 RPC의 한계
| RPC | `eth_getLogs` 범위 | 비고 |
|---|---|---|
| `1rpc.io/matic` | 최대 50블록 | 초과 시 -32602 오류 |
| `polygon.drpc.org` | 100블록 성공, 500블록 이상 HTTP 400 | 정확한 상한은 100~500 사이 |

- 규모: 100블록당 `OrderFilled` 약 4,700건(블록당 약 47건). Polygon을 약 2초 블록으로 보면 하루 약 200만 건이다.
- 따라서 전체 기간 지갑 수익 랭킹은 무료 RPC로 계산할 수 없다. 특정 사건 전후 몇 시간 창은 50블록 단위 호출을 반복하면 계산할 수 있다(3시간 = 약 5,400블록 = 약 108회).
- `tokenId`는 이벤트의 `data` 필드(비인덱스)라서 RPC 필터로 시장을 좁힐 수 없고, 받은 뒤 로컬에서 걸러야 한다.
- `taker`가 지갑이 아니라 거래소 컨트랙트 자체인 경우가 약 39%(1,838/4,697)다. 지갑 단위 귀속에는 `OrdersMatched`나 트랜잭션 단위 추적이 추가로 필요하다.

### 8-3. 시장 제목·결과 매핑
- `tokenId` → 시장 제목·결과는 Gamma(`version` 포함)가 필요하나 이 PC에서는 막혀 있다.
- 서드파티 인덱서: Goldsky 문서는 2026-04-28 V2 전환 이후 기존 공개 서브그래프가 불완전하거나 부정확하다고 안내하고, 대안인 데이터셋은 계정(`goldsky login`)이 필요하다. Dune, Allium도 계정이 필요하다. CryptoHouse는 접속 방법을 확인하지 못했다.

### 8-4. Kalshi 금리 과거 데이터
- `/historical/markets?series_ticker=KXFEDDECISION`(2026-08-22 이전)와 `/markets?status=settled`(이후)를 합쳐 연준 금리 결정 28회(2023~2026)의 결과와 일봉 캔들을 얻을 수 있다.
- 스키마 차이: 과거(historical) 캔들은 `price.close`, 현행 캔들은 `price.close_dollars`로 필드명이 다르다.
- 회의 하루 전 확률 기준으로 실제 결과가 된 선택지의 확률은 27회 중 최저 0.59(2024-09 회의의 26bp 이상 인하, `FEDDECISION-24SEP` C26), 중앙값 0.98이었다. 회의 1건(`FEDDECISION-24JAN`)은 전날 캔들이 없어 제외했다. 0.5 미만은 0회다. 즉 "하루 전 확률 기준 의외의 결과"는 연준 금리 시장에서는 거의 발생하지 않는다.
