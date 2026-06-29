import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import {
  FileSpreadsheet,
  FileText,
  CalendarDays,
  TrendingUp,
  ArrowDownUp,
  Wallet,
  Clock,
} from "lucide-react";
import {
  BOOK_VALUATIONS,
  VALUATION_DATE,
  fmtCompact,
  fmtDate,
} from "../engine/book-compute";

/* ── helpers ─────────────────────────────────────────────────── */
function fmtNGN(v: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(v);
}

function fmtNum(v: number) {
  return new Intl.NumberFormat("en-NG").format(v);
}

function parseDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

type ActivityRow = {
  activity: string;
  requests: number;
  requested: number;
  disbursed: number;
  completion: number;
};

/* ── main component ───────────────────────────────────────────── */
export function PortfolioReports() {
  const vDate = parseDate(VALUATION_DATE);
  const firstOfMonth = isoDate(
    new Date(Date.UTC(vDate.getUTCFullYear(), vDate.getUTCMonth(), 1)),
  );

  const [mode, setMode] = useState<
    "Monthly" | "Quarterly" | "Annual" | "Custom"
  >("Monthly");
  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(VALUATION_DATE);

  const activeWindow = useMemo(() => {
    const s = parseDate(startDate);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    if (mode === "Monthly")
      return `${months[s.getUTCMonth()]} ${s.getUTCFullYear()}`;
    if (mode === "Quarterly") {
      const q = Math.floor(s.getUTCMonth() / 3) + 1;
      return `Q${q} ${s.getUTCFullYear()}`;
    }
    if (mode === "Annual") return `FY ${s.getUTCFullYear()}`;
    return `${fmtDate(startDate)} \u2013 ${fmtDate(endDate)}`;
  }, [mode, startDate, endDate]);

  const filteredValuations = useMemo(() => {
    const s = parseDate(startDate);
    const e = parseDate(endDate);
    return BOOK_VALUATIONS.filter((v) => {
      const d = parseDate(v.instrument.purchaseDate);
      return d >= s && d <= e;
    });
  }, [startDate, endDate]);

  const stats = useMemo(() => {
    const transactions = filteredValuations.length;
    const totalRequested = filteredValuations.reduce(
      (acc, v) => acc + v.instrument.faceValue,
      0,
    );
    const totalDisbursed = filteredValuations.reduce(
      (acc, v) => acc + v.dirtyFairValue,
      0,
    );
    const pending = filteredValuations.filter(
      (v) => v.instrument.status !== "Active",
    ).length;
    return { transactions, totalRequested, totalDisbursed, pending };
  }, [filteredValuations]);

  const activityRows: ActivityRow[] = useMemo(() => {
    const map = new Map<
      string,
      { requests: number; requested: number; disbursed: number }
    >();
    for (const v of filteredValuations) {
      const cls = v.instrument.instrumentType;
      const cur = map.get(cls) ?? { requests: 0, requested: 0, disbursed: 0 };
      cur.requests += 1;
      cur.requested += v.instrument.faceValue;
      cur.disbursed += v.dirtyFairValue;
      map.set(cls, cur);
    }
    return Array.from(map.entries())
      .map(([activity, d]) => ({
        activity,
        requests: d.requests,
        requested: d.requested,
        disbursed: d.disbursed,
        completion: d.requested > 0 ? (d.disbursed / d.requested) * 100 : 0,
      }))
      .sort((a, b) => b.requested - a.requested);
  }, [filteredValuations]);

  const topClass = activityRows[0];
  const insight = useMemo(() => {
    if (activityRows.length === 0)
      return "No transaction data in selected date range.";
    const pct =
      stats.totalRequested > 0
        ? ((stats.totalDisbursed / stats.totalRequested) * 100).toFixed(1)
        : "0.0";
    return `During ${activeWindow}, ${stats.transactions} instrument${stats.transactions !== 1 ? "s" : ""} settled with a total face value of ${fmtNGN(stats.totalRequested)}. Net disbursed amount was ${fmtNGN(stats.totalDisbursed)} (${pct}% of requested).${topClass ? ` ${topClass.activity} was the most active class with ${topClass.requests} transactions totalling ${fmtNGN(topClass.requested)}.` : ""}`;
  }, [activityRows, stats, activeWindow, topClass]);

  const handleExcel = () => {
    const data: (string | number)[][] = [
      ["Portfolio Report", activeWindow],
      [],
      ["SUMMARY"],
      ["Transactions", stats.transactions],
      ["Total Requested (NGN)", stats.totalRequested],
      ["Total Disbursed (NGN)", +stats.totalDisbursed.toFixed(0)],
      ["Pending Drafts", stats.pending],
      [],
      ["ACTIVITY BREAKDOWN"],
      ["Asset Class", "Transactions", "Requested (NGN)", "Disbursed (NGN)", "Completion %"],
      ...activityRows.map((r) => [
        r.activity, r.requests,
        +r.requested.toFixed(0), +r.disbursed.toFixed(0),
        +r.completion.toFixed(1),
      ]),
      [],
      ["INSTRUMENT DETAIL"],
      ["ID", "Name", "Asset Class", "Face Value", "Dirty Price", "Settlement Date"],
      ...filteredValuations.map((v) => [
        v.instrument.id, v.instrument.name, v.instrument.instrumentType,
        +v.instrument.faceValue.toFixed(0), +v.dirtyFairValue.toFixed(0),
        v.instrument.purchaseDate,
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Portfolio Report");
    XLSX.writeFile(wb, `portfolio-report-${startDate}.xlsx`);
  };

  const handlePDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = 210;
    const margin = 20;
    const usableW = pageW - margin * 2; // 170mm
    const date = new Date().toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" });

    // PDF-safe number formatters (no ₦ symbol — Helvetica doesn't support it)
    const pdfFull = (v: number) =>
      "NGN " + new Intl.NumberFormat("en-NG").format(Math.round(v));
    const pdfCompact = (v: number) => {
      if (v >= 1e9) return `NGN ${(v / 1e9).toFixed(2)}B`;
      if (v >= 1e6) return `NGN ${(v / 1e6).toFixed(1)}M`;
      if (v >= 1e3) return `NGN ${(v / 1e3).toFixed(0)}K`;
      return `NGN ${Math.round(v)}`;
    };

    // PDF-safe insight (replace fmtNGN output with ASCII-safe version)
    const pctStr =
      stats.totalRequested > 0
        ? ((stats.totalDisbursed / stats.totalRequested) * 100).toFixed(1)
        : "0.0";
    const pdfInsight =
      activityRows.length === 0
        ? "No transaction data in selected date range."
        : `During ${activeWindow}, ${stats.transactions} instrument${stats.transactions !== 1 ? "s" : ""} settled with a total face value of ${pdfFull(stats.totalRequested)}. Net disbursed amount was ${pdfFull(stats.totalDisbursed)} (${pctStr}% of requested).${topClass ? ` ${topClass.activity} was the most active class with ${topClass.requests} transactions totalling ${pdfFull(topClass.requested)}.` : ""}`;

    // ── Header bar ──────────────────────────────────────────────
    doc.setFillColor(200, 16, 46);
    doc.rect(0, 0, pageW, 18, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Leadway Quanta - Portfolio Management", margin, 12);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(date, pageW - margin - 22, 12);

    // ── Title ────────────────────────────────────────────────────
    doc.setTextColor(26, 26, 46);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Portfolio Report", margin, 30);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 120);
    doc.text(`Active Window: ${activeWindow}`, margin, 38);

    doc.setDrawColor(220, 220, 230);
    doc.line(margin, 42, pageW - margin, 42);

    // ── KPI metrics (2x2) ────────────────────────────────────────
    const kpis = [
      { label: "TRANSACTIONS",    value: String(stats.transactions) },
      { label: "TOTAL REQUESTED", value: pdfFull(stats.totalRequested) },
      { label: "TOTAL DISBURSED", value: pdfFull(stats.totalDisbursed) },
      { label: "PENDING DRAFTS",  value: String(stats.pending) },
    ];
    const boxW = (usableW - 6) / 2; // ~82mm each
    kpis.forEach((k, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = margin + col * (boxW + 6);
      const y = 47 + row * 22;
      doc.setFillColor(247, 247, 248);
      doc.roundedRect(x, y, boxW, 18, 2, 2, "F");
      // Label
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(130, 130, 150);
      doc.text(k.label, x + 4, y + 6);
      // Value — shrink font if needed
      doc.setFont("helvetica", "bold");
      doc.setTextColor(26, 26, 46);
      const valWidth = doc.getTextWidth(k.value);
      const valFontSize = valWidth > boxW - 8 ? ((boxW - 8) / valWidth) * 10 : 10;
      doc.setFontSize(Math.max(valFontSize, 7));
      doc.text(k.value, x + 4, y + 14);
    });

    // ── Activity breakdown table ─────────────────────────────────
    let y = 100;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(26, 26, 46);
    doc.text("Activity Breakdown", margin, y);
    y += 5;

    // Column positions (fit within usableW=170mm, right edge = 190)
    // Asset Class | Req | Requested       | Disbursed       | Compl.%
    //  20→62 42mm | 4mm | 66→109 43mm     | 109→152 43mm    | 152→190 18mm
    const colX = [margin, margin + 44, margin + 50, margin + 95, margin + 152];
    const colW = [42, 4, 43, 43, 18];
    const tHdrs = ["Asset Class", "Req.", "Requested (NGN)", "Disbursed (NGN)", "Compl.%"];

    doc.setFillColor(200, 16, 46);
    doc.rect(margin, y, usableW, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    tHdrs.forEach((h, i) => doc.text(h, colX[i] + 1.5, y + 5));
    y += 7;

    if (activityRows.length === 0) {
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, y, usableW, 8, "F");
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(160, 160, 180);
      doc.text("No data in selected date range.", margin + 2, y + 5.5);
      y += 8;
    } else {
      activityRows.forEach((r, idx) => {
        const bg = idx % 2 === 0 ? [255, 255, 255] : [247, 247, 248];
        doc.setFillColor(bg[0], bg[1], bg[2]);
        doc.rect(margin, y, usableW, 7, "F");
        doc.setTextColor(26, 26, 46);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        const vals = [
          r.activity,
          String(r.requests),
          pdfCompact(r.requested),
          pdfCompact(r.disbursed),
          r.completion.toFixed(1) + "%",
        ];
        vals.forEach((v, i) => {
          // right-align numeric columns (1-4)
          if (i >= 1) {
            const tw = doc.getTextWidth(v);
            doc.text(v, colX[i] + colW[i] - tw - 1, y + 5);
          } else {
            doc.text(v, colX[i] + 1.5, y + 5);
          }
        });
        y += 7;
      });
    }

    // ── Insight block ─────────────────────────────────────────────
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const insightLines = doc.splitTextToSize(pdfInsight, usableW - 14) as string[];
    const insightH = insightLines.length * 5.5 + 10;
    doc.setFillColor(253, 245, 245);
    doc.roundedRect(margin, y, usableW, insightH, 2, 2, "F");
    doc.setFillColor(200, 16, 46);
    doc.rect(margin, y, 3, insightH, "F");
    doc.setTextColor(70, 70, 90);
    doc.text(insightLines, margin + 7, y + 7);

    // ── Footer ───────────────────────────────────────────────────
    doc.setDrawColor(220, 220, 230);
    doc.line(margin, 275, pageW - margin, 275);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 180);
    doc.text("Generated by Leadway Quanta - Confidential", margin, 280);
    doc.text("Page 1 of 1", pageW - margin - 14, 280);

    doc.save(`portfolio-report-${startDate}.pdf`);
  };

  const hasData = activityRows.length > 0;

  return (
    <div className="p-3 sm:p-4 md:p-6 xl:p-8 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-dark-gray">Reports</h1>
        <p className="mt-1 text-sm text-gray-500">
          Generate weekly, monthly, or custom performance reports
        </p>
      </div>

      {/* Filter card */}
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Report Filters
            </p>
            <h2 className="text-base font-semibold text-dark-gray">
              Generate Professional Financial Reports
            </h2>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleExcel}
              className="flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-semibold text-dark-gray shadow-sm transition-all hover:border-green-500 hover:text-green-700"
            >
              <FileSpreadsheet className="h-4 w-4 text-green-600" />
              Excel
            </button>
            <button
              onClick={handlePDF}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary/90"
            >
              <FileText className="h-4 w-4" />
              PDF
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">
              Mode
            </label>
            <select
              value={mode}
              onChange={(e) => {
                const m = e.target.value as typeof mode;
                setMode(m);
                const now = parseDate(VALUATION_DATE);
                if (m === "Monthly") {
                  setStartDate(
                    isoDate(
                      new Date(
                        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
                      ),
                    ),
                  );
                  setEndDate(VALUATION_DATE);
                } else if (m === "Quarterly") {
                  const q = Math.floor(now.getUTCMonth() / 3);
                  setStartDate(
                    isoDate(new Date(Date.UTC(now.getUTCFullYear(), q * 3, 1))),
                  );
                  setEndDate(VALUATION_DATE);
                } else if (m === "Annual") {
                  setStartDate(
                    isoDate(new Date(Date.UTC(now.getUTCFullYear(), 0, 1))),
                  );
                  setEndDate(VALUATION_DATE);
                }
              }}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-gray focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option>Monthly</option>
              <option>Quarterly</option>
              <option>Annual</option>
              <option>Custom</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setMode("Custom");
              }}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-gray focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setMode("Custom");
              }}
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-dark-gray focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-500">
              Active Window
            </label>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm font-medium text-dark-gray">
              <CalendarDays className="h-4 w-4 text-primary shrink-0" />
              {activeWindow}
            </div>
          </div>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(
          [
            {
              label: "Transactions",
              value: fmtNum(stats.transactions),
              icon: <ArrowDownUp className="h-5 w-5" />,
              color: "text-primary",
              bg: "bg-pale-red",
            },
            {
              label: "Total Requested",
              value:
                stats.totalRequested > 0
                  ? fmtCompact(stats.totalRequested)
                  : "\u20a60",
              icon: <Wallet className="h-5 w-5" />,
              color: "text-blue-700",
              bg: "bg-blue-50",
            },
            {
              label: "Total Disbursed",
              value:
                stats.totalDisbursed > 0
                  ? fmtCompact(stats.totalDisbursed)
                  : "\u20a60",
              icon: <TrendingUp className="h-5 w-5" />,
              color: "text-green-700",
              bg: "bg-green-50",
            },
            {
              label: "Pending Drafts",
              value: fmtNum(stats.pending),
              icon: <Clock className="h-5 w-5" />,
              color: "text-yellow-700",
              bg: "bg-yellow-50",
            },
          ] as const
        ).map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-4 rounded-xl border border-border bg-white p-5 shadow-sm"
          >
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.bg} ${s.color}`}
            >
              {s.icon}
            </div>
            <div>
              <p className="text-xs font-medium text-gray-400">{s.label}</p>
              <p className="text-xl font-bold text-dark-gray">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Activity Breakdown */}
      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-dark-gray">
            Activity Breakdown
          </h3>
        </div>
        {hasData ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-muted">
                  {[
                    "Activity",
                    "Requests",
                    "Requested",
                    "Disbursed",
                    "Completion",
                  ].map((h, i) => (
                    <th
                      key={h}
                      className={`px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 ${i === 0 ? "text-left" : "text-right"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activityRows.map((row) => (
                  <tr
                    key={row.activity}
                    className="hover:bg-surface-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-dark-gray">
                      {row.activity}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600">
                      {fmtNum(row.requests)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600">
                      {fmtNGN(Math.round(row.requested))}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600">
                      {fmtNGN(Math.round(row.disbursed))}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{
                              width: `${Math.min(row.completion, 100).toFixed(1)}%`,
                            }}
                          />
                        </div>
                        <span className="text-gray-600 w-12 text-right">
                          {row.completion.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarDays className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-400">
              No transaction data in selected date range.
            </p>
            <p className="text-xs text-gray-300 mt-1">
              Adjust the start and end date to view activity.
            </p>
          </div>
        )}
      </div>

      {/* Report Insight */}
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-dark-gray">
          Report Insight
        </h3>
        <p className="text-sm leading-relaxed text-gray-600">{insight}</p>
      </div>

      {/* Footer */}
      <p className="text-xs text-gray-400 border-t border-border pt-4">
        Exports include all filtered transactions and summary totals. Data
        sourced from the canonical instrument book as at{" "}
        {fmtDate(VALUATION_DATE)}.
      </p>
    </div>
  );
}
