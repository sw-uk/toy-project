import { cookies } from "next/headers";

import { createI18n, LOCALE_COOKIE, parseLocale } from ".";

/** 서버 컴포넌트에서 방문자가 고른 언어로 문구를 만든다. */
export async function getI18n() {
  const store = await cookies();
  return createI18n(parseLocale(store.get(LOCALE_COOKIE)?.value));
}
