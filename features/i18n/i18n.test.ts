import { describe, expect, test } from "vitest";

import { createI18n, parseLocale } from "@/features/i18n";

describe("언어 선택", () => {
  test("알려진 값만 받아들이고 나머지는 미국 영어로 둔다", () => {
    expect(parseLocale("ko")).toBe("ko");
    expect(parseLocale("gb")).toBe("gb");
    expect(parseLocale("en")).toBe("en");
    expect(parseLocale("fr")).toBe("en");
    expect(parseLocale(undefined)).toBe("en");
  });
});

describe("문구 번역", () => {
  test("영국 영어는 미국 영어와 철자와 금융 용어가 다르다", () => {
    expect(createI18n("en").t("home_h1")).toBe("What the markets are signaling");
    expect(createI18n("gb").t("home_h1")).toBe("What the markets are signalling");
    expect(createI18n("en").t("tab_dep")).toBe("Certificate of deposit");
    expect(createI18n("gb").t("tab_dep")).toBe("Fixed-term deposit");
    expect(createI18n("ko").t("tab_dep")).toBe("정기예금");
  });

  test("{이름} 자리표시자를 값으로 바꾼다", () => {
    expect(createI18n("en").t("in_days", { n: 6 })).toBe("in 6 days");
    expect(createI18n("ko").t("in_days", { n: 6 })).toBe("6일 후");
  });

  test("번역이 없는 키는 미국 영어 문구를 쓰고, 그것도 없으면 키를 돌려준다", () => {
    const i18n = createI18n("gb");
    expect(i18n.t("nav_home")).toBe("Home");
    expect(i18n.t("no_such_key")).toBe("no_such_key");
  });
});

describe("날짜와 금액 표기", () => {
  const iso = "2026-10-28";

  test("언어마다 날짜 형식이 다르다", () => {
    expect(createI18n("en").date(iso)).toBe("Oct 28, 2026");
    expect(createI18n("gb").date(iso)).toBe("28 Oct 2026");
    expect(createI18n("ko").date(iso)).toBe("2026년 10월 28일");
  });

  test("금액은 달러로 쓰고 천 단위를 끊는다", () => {
    expect(createI18n("en").money(48_200)).toBe("$48,200");
    expect(createI18n("ko").money(48_200)).toBe("US$48,200");
  });
});

describe("경과 시간 표기", () => {
  const MIN = 60_000;

  test("1분 안은 방금, 그 뒤는 분·시간·일 단위로 언어에 맞게 쓴다", () => {
    expect(createI18n("en").ago(20_000)).toBe("just now");
    expect(createI18n("en").ago(5 * MIN)).toBe("5 minutes ago");
    expect(createI18n("en").ago(3 * 60 * MIN)).toBe("3 hours ago");
    expect(createI18n("ko").ago(5 * MIN)).toBe("5분 전");
    expect(createI18n("gb").ago(2 * 24 * 60 * MIN)).toBe("2 days ago");
  });
});
