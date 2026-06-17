import { useMemo } from "react";
import { CalendarClock } from "lucide-react";
import {
  DataTable,
  type DataTableColumn,
} from "../../../components/shared/data-table";
import { SectionCard } from "../../../components/shared/section-card";
import { Badge } from "../../../components/shared/badge";
import { StatCard, StatCardGrid } from "../../../components/shared/stat-card";
import {
  BOOK_INSTRUMENTS,
  fmtCompact,
  fmtPct,
  fmtDate,
  daysBetween,
} from "../../portfolio/engine/book-compute";

const VALUATION_DATE = "2026-05-28";

interface CouponRow {
  id: string;
  instrumentName: string;
  type: string;
  issuer: string;
  faceValue: number;
  couponRate: number;
  couponFrequency: string;
  periodCoupon: number;
  nextCouponDate: string;
  daysToNext: number;
  maturityDate: string;
}

function getNextCouponDate(
  purchaseDate: string,
  maturityDate: string,
  freqMonths: number,
): string | null {
  const mat = new Date(maturityDate + "T00:00:00Z");
  const val = new Date(VALUATION_DATE + "T00:00:00Z");
  // walk from purchase forward by freqMonths until we find next future date
  let d = new Date(purchaseDate + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + freqMonths);
  while (d.getTime() <= val.getTime()) {
    d.setUTCMonth(d.getUTCMonth() + freqMonths);
  }
  if (d.getTime() > mat.getTime()) return maturityDate;
  return d.toISOString().slice(0, 10);
}

function freqMonths(freq: string): number {
  if (freq === "Semi") return 6;
  if (freq === "Annual") return 12;
  if (freq === "Quarterly") return 3;
  if (freq === "Monthly") return 1;
  return 0;
}

type Row = CouponRow & Record<string, unknown>;

export function CouponSchedules() {
  const rows = useMemo<Row[]>(() => {
    const result: CouponRow[] = [];
    for (const inst of BOOK_INSTRUMENTS) {
      if (!inst.couponRate || inst.couponRate === 0) continue;
      if (!inst.maturityDate) continue;
      const fm = freqMonths(inst.couponFrequency);
      if (fm === 0) continue;
      const next = getNextCouponDate(inst.purchaseDate, inst.maturityDate, fm);
      if (!next) continue;
      const periodCoupon = (inst.faceValue * inst.couponRate) / (12 / fm);
      const days = daysBetween(VALUATION_DATE, next);
      result.push({
        id: inst.id,
        instrumentName: inst.name,
        type: inst.instrumentType,
        issuer: inst.issuer,
        faceValue: inst.faceValue,
        couponRate: inst.couponRate,
        couponFrequency: inst.couponFrequency,
        periodCoupon,
        nextCouponDate: next,
        daysToNext: days,
        maturityDate: inst.maturityDate,
      });
    }
    return result.sort((a, b) => a.daysToNext - b.daysToNext) as Row[];
  }, []);

  const totalNextPeriod = rows.reduce((s, r) => s + r.periodCoupon, 0);
  const within30 = rows.filter((r) => r.daysToNext <= 30).length;
  const within90 = rows.filter((r) => r.daysToNext <= 90).length;

  const cols: DataTableColumn<Row>[] = [
    { key: "id", header: "ID", width: "90px" },
    { key: "instrumentName", header: "Instrument" },
    {
      key: "type",
      header: "Type",
      render: (r) => (
        <Badge variant="neutral" size="sm">
          {r.type}
        </Badge>
      ),
    },
    { key: "issuer", header: "Issuer" },
    {
      key: "faceValue",
      header: "Face Value",
      align: "right",
      render: (r) => fmtCompact(r.faceValue),
    },
    {
      key: "couponRate",
      header: "Coupon Rate",
      align: "right",
      render: (r) => fmtPct(r.couponRate),
    },
    { key: "couponFrequency", header: "Freq" },
    {
      key: "periodCoupon",
      header: "Period Coupon",
      align: "right",
      render: (r) => (
        <span className="font-medium text-primary">
          {fmtCompact(r.periodCoupon)}
        </span>
      ),
    },
    {
      key: "nextCouponDate",
      header: "Next Coupon Date",
      render: (r) => fmtDate(r.nextCouponDate),
    },
    {
      key: "daysToNext",
      header: "Days",
      align: "right",
      render: (r) => {
        const cls =
          r.daysToNext <= 30
            ? "text-primary font-semibold"
            : r.daysToNext <= 90
              ? "text-amber-600"
              : "text-dark-gray/60";
        return <span className={cls}>{r.daysToNext}</span>;
      },
    },
    {
      key: "maturityDate",
      header: "Maturity",
      render: (r) => fmtDate(r.maturityDate),
    },
  ];

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray flex items-center gap-2">
          <CalendarClock className="h-6 w-6 text-primary" />
          Coupon Schedules
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          Future coupon payment dates for all coupon-bearing instruments ·{" "}
          {rows.length} instruments · Reference date 28 May 2026
        </p>
      </div>

      <StatCardGrid>
        <StatCard
          title="Coupon-Bearing"
          value={String(rows.length)}
          subtitle="Instruments with coupon schedule"
          variant="highlight"
        />
        <StatCard
          title="Due Within 30 Days"
          value={String(within30)}
          subtitle="Immediate cashflow"
          variant="warning"
        />
        <StatCard
          title="Due Within 90 Days"
          value={String(within90)}
          subtitle="Near-term cashflow"
          variant="default"
        />
        <StatCard
          title="Total Next Period Coupons"
          value={fmtCompact(totalNextPeriod)}
          subtitle="Aggregate next payment"
          variant="default"
        />
      </StatCardGrid>

      <SectionCard
        title="Upcoming Coupon Payments"
        description="Sorted by days to next coupon"
      >
        <DataTable<Row>
          columns={cols}
          data={rows}
          keyExtractor={(r) => r.id}
          emptyMessage="No coupon-bearing instruments"
        />
      </SectionCard>
    </div>
  );
}
