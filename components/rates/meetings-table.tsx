"use client";

import { Fragment, useState } from "react";

import { DisclosureArrow } from "@/components/shell/disclosure-arrow";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/features/i18n/provider";

export type MeetingRow = {
  date: string;
  inText: string;
  rise: number;
  hold: number;
  cut: number;
};

/** 향후 6개월 회의표. 행마다 동결·인하 확률을 펼칠 수 있다. */
export function MeetingsTable({ rows }: { rows: MeetingRow[] }) {
  const { t } = useI18n();
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (date: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (!next.delete(date)) next.add(date);
      return next;
    });

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table className="min-w-[520px]">
        <TableHeader>
          <TableRow>
            <TableHead>{t("col_date")}</TableHead>
            <TableHead>{t("col_in")}</TableHead>
            <TableHead>{t("col_rise")}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <Fragment key={row.date}>
              <TableRow data-testid="meeting-row">
                <TableCell>{row.date}</TableCell>
                <TableCell className="tabular-nums">{row.inText}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Progress value={row.rise} className="w-28 flex-none" aria-label={`${row.rise}%`} />
                    <span className="tabular-nums">{row.rise}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 text-sm underline underline-offset-4"
                    aria-expanded={open.has(row.date)}
                    onClick={() => toggle(row.date)}
                  >
                    {t("hold_cut")}
                    <DisclosureArrow open={open.has(row.date)} />
                  </button>
                </TableCell>
              </TableRow>
              {open.has(row.date) ? (
                <TableRow className="bg-muted/50" data-testid="meeting-detail">
                  <TableCell colSpan={4}>
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                      <span>
                        {t("w_hold")} <b className="tabular-nums">{row.hold}%</b>
                      </span>
                      <span>
                        {t("w_cut")} <b className="tabular-nums">{row.cut}%</b>
                      </span>
                      <span className="text-muted-foreground">
                        {t("w_rise")} <span className="tabular-nums">{row.rise}%</span>
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
