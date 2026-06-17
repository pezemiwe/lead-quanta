import {
  BOOK_INSTRUMENTS,
  BOOK_VALUATIONS,
  fmtCompact,
  fmtPct,
  fmtDate,
} from "../../../features/portfolio/engine/book-compute";
import {
  DataTable,
  DataTableColumn,
} from "../../../components/shared/data-table";

type CouponRow = {
  id: string;
  name: string;
  issuer: string;
  couponRate: number;
  couponFrequency: string;
  faceValue: number;
  annualCoupon: number;
  periodCoupon: number;
  nextCouponDate: string;
  wtax: number;
  netCoupon: number;
  maturityDate: string;
};

const FREQ_MONTHS: Record<string, number> = {
  Monthly: 1,
  Quarterly: 3,
  "Semi-Annual": 6,
  Annual: 12,
};

const VALUATION_DATE = new Date("2026-05-28");

const ROWS: CouponRow[] = BOOK_INSTRUMENTS.filter(
  (i) => i.couponRate > 0 && i.couponFrequency !== "Zero",
).map((inst) => {
  const allIdx = BOOK_INSTRUMENTS.indexOf(inst);
  const val = BOOK_VALUATIONS[allIdx];
  const freqMonths = FREQ_MONTHS[inst.couponFrequency] ?? 6;
  const annualCoupon = inst.faceValue * inst.couponRate;
  const periodCoupon = annualCoupon / (12 / freqMonths);
  const wtax = periodCoupon * 0.1; // 10% withholding tax
  const nextMs = VALUATION_DATE.getTime() + freqMonths * 30 * 86400000;
  return {
    id: inst.id,
    name: inst.name,
    issuer: inst.issuer,
    couponRate: inst.couponRate,
    couponFrequency: inst.couponFrequency,
    faceValue: inst.faceValue,
    annualCoupon,
    periodCoupon,
    nextCouponDate: new Date(nextMs).toISOString().slice(0, 10),
    wtax,
    netCoupon: periodCoupon - wtax,
    maturityDate: inst.maturityDate ?? "—",
  };
});

const COLUMNS: DataTableColumn<CouponRow>[] = [
  {
    key: "name",
    header: "Instrument",
    render: (r) => (
      <span className="text-xs font-medium text-dark-gray">{r.name}</span>
    ),
  },
  {
    key: "issuer",
    header: "Issuer",
    render: (r) => <span className="text-xs text-gray-500">{r.issuer}</span>,
  },
  {
    key: "couponRate",
    header: "Coupon Rate",
    render: (r) => (
      <span className="text-xs font-semibold text-primary">
        {fmtPct(r.couponRate)}
      </span>
    ),
  },
  {
    key: "couponFrequency",
    header: "Frequency",
    render: (r) => (
      <span className="text-xs text-gray-500">{r.couponFrequency}</span>
    ),
  },
  {
    key: "annualCoupon",
    header: "Annual Coupon (₦)",
    render: (r) => (
      <span className="text-xs text-right block">
        {fmtCompact(r.annualCoupon)}
      </span>
    ),
  },
  {
    key: "periodCoupon",
    header: "Period Coupon (₦)",
    render: (r) => (
      <span className="text-xs font-semibold text-right block">
        {fmtCompact(r.periodCoupon)}
      </span>
    ),
  },
  {
    key: "wtax",
    header: "W'Tax (10%)",
    render: (r) => (
      <span className="text-xs text-danger text-right block">
        {fmtCompact(r.wtax)}
      </span>
    ),
  },
  {
    key: "netCoupon",
    header: "Net Coupon (₦)",
    render: (r) => (
      <span className="text-xs font-semibold text-success text-right block">
        {fmtCompact(r.netCoupon)}
      </span>
    ),
  },
  {
    key: "nextCouponDate",
    header: "Next Coupon",
    render: (r) => (
      <span className="text-xs text-gray-400">{fmtDate(r.nextCouponDate)}</span>
    ),
  },
];

const totalAnnual = ROWS.reduce((s, r) => s + r.annualCoupon, 0);
const totalPeriod = ROWS.reduce((s, r) => s + r.periodCoupon, 0);
const totalNet = ROWS.reduce((s, r) => s + r.netCoupon, 0);

export function CouponRecognition() {
  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Valuation Postings
        </p>
        <h1 className="mt-1 text-2xl font-bold text-dark-gray">
          Coupon Recognition
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Coupon income schedule for {ROWS.length} interest-bearing instruments as at 28 May 2026
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: "Coupon-Paying Instruments",
            value: String(ROWS.length),
            sub: "with scheduled coupons",
          },
          {
            label: "Total Annual Coupon",
            value: fmtCompact(totalAnnual),
            sub: "gross before WHT",
          },
          {
            label: "Next-Period Coupon",
            value: fmtCompact(totalPeriod),
            sub: "across all frequencies",
          },
          {
            label: "Net After WHT",
            value: fmtCompact(totalNet),
            sub: "after 10% withholding",
          },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-border bg-surface p-4 shadow-sm"
          >
            <p className="text-xs text-gray-400">{k.label}</p>
            <p className="mt-2 text-xl font-bold text-dark-gray">{k.value}</p>
            <p className="text-xs text-gray-400">{k.sub}</p>
          </div>
        ))}
      </div>

      <DataTable columns={COLUMNS} data={ROWS} pageSize={25} />
    </div>
  );
}
