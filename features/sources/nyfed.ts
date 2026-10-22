const BASE = "https://markets.newyorkfed.org/api/rates/unsecured/effr";

export type EffrPoint = { date: string; rate: number };

type EffrBody = {
  refRates: { effectiveDate: string; percentRate: number }[];
};

/** 뉴욕 연준 응답을 날짜 오름차순의 (날짜, 금리) 목록으로 바꾼다. */
export function parseEffr(body: EffrBody): EffrPoint[] {
  return body.refRates
    .map((row) => ({ date: row.effectiveDate, rate: row.percentRate }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** 시작일부터 종료일까지의 실효 연방기금금리(키 불필요). */
export async function fetchEffr(from: string, to: string): Promise<EffrPoint[]> {
  const url = `${BASE}/search.json?startDate=${from}&endDate=${to}`;
  const response = await fetch(url, {
    headers: { "user-agent": "PreSignal/0.1" },
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`NY Fed ${response.status}`);
  return parseEffr((await response.json()) as EffrBody);
}
