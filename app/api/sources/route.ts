import { checkReachability } from "@/features/sources";

/**
 * 배포된 서버가 어떤 데이터 출처에 닿는지 확인한다(실현 가능성 확인용).
 * 결과에는 서버 지역을 함께 담는다. Vercel이 VERCEL_REGION을 채운다.
 */
export async function GET() {
  const results = await checkReachability();
  return Response.json({
    region: process.env.VERCEL_REGION ?? "local",
    checkedAt: new Date().toISOString(),
    results,
  });
}
