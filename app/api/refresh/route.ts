import { cookies } from "next/headers";

import { checkVisitor, recordVisitor } from "@/features/refresh/visitors";
import { refreshScope } from "@/features/snapshots";

const VISITOR_COOKIE = "presignal-visitor";
const SCOPE = /^(home|rates|event:[\w.-]{1,80})$/;

/** 방문자가 "지금 새로 고침"을 눌렀을 때 해당 화면의 저장 데이터를 새로 만든다. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { scope?: unknown } | null;
  const scope = body?.scope;
  if (typeof scope !== "string" || !SCOPE.test(scope)) {
    return Response.json({ error: "bad scope" }, { status: 400 });
  }

  const store = await cookies();
  let visitor = store.get(VISITOR_COOKIE)?.value;
  if (!visitor) {
    visitor = crypto.randomUUID();
    store.set(VISITOR_COOKIE, visitor, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  const now = Date.now();
  const check = checkVisitor(visitor, now);
  if (!check.allowed) {
    return Response.json(
      { reason: check.reason, retryAfterMs: check.retryAfterMs },
      { status: 429 },
    );
  }

  try {
    const fetchedAt = await refreshScope(scope, now);
    recordVisitor(visitor, now);
    return Response.json({ fetchedAt });
  } catch {
    return Response.json({ error: "refresh failed" }, { status: 502 });
  }
}
