import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import {
  FileText,
  Download,
  FileBarChart2,
  FileSpreadsheet,
} from "lucide-react";
import { SectionCard } from "../../../components/shared/section-card";
import { Button } from "../../../components/shared/button";
import { Badge } from "../../../components/shared/badge";
import { useIFRS9 } from "../store";
import { fmtCompact, fmtPct } from "../utils/format";

const REPORTS = [
  {
    id: "summary",
    icon: <FileText className="h-4 w-4" />,
    title: "ECL Summary Report",
    description: "Single-page board summary with stage & specification totals.",
  },
  {
    id: "detail",
    icon: <FileSpreadsheet className="h-4 w-4" />,
    title: "Per-Instrument Detail",
    description: "Full breakdown including TTM, ratings, EAD[0] and ECL.",
  },
  {
    id: "movement",
    icon: <FileBarChart2 className="h-4 w-4" />,
    title: "Stage Movement Analysis",
    description: "Stage migration vs prior period (placeholder for now).",
  },
];

export function IFRS9Reports() {
  const { result } = useIFRS9();

  const downloadXlsx = (id: string) => {
    let headers: (string | number)[] = [];
    let rows: (string | number)[][] = [];
    let sheetName = "Sheet1";

    switch (id) {
      case "detail":
        headers = ["SN", "Counterparty", "Specification", "Currency",
          "Carrying LCY", "Rating Eq.", "Final Stage", "TTM",
          "EAD[0]", "LGD[0]", "ECL", "Coverage"];
        rows = result.rows.map((r) => [
          r.sn, r.counterparty, r.assetSpecification, r.currency,
          +r.carryingAmountLcy.toFixed(2), r.ratingEquivalent, r.finalStage,
          r.ttm, +(r.ead[0] ?? r.carryingAmountLcy).toFixed(2),
          +(r.lgd[0] ?? 0).toFixed(4), +r.ecl.toFixed(2),
          +r.coverageRatio.toFixed(6),
        ]);
        sheetName = "Per-Instrument Detail";
        break;
      case "movement":
        headers = ["Counterparty", "Model Stage", "Override", "Final Stage"];
        rows = result.rows.map((r) => [
          r.counterparty, r.modelStage,
          r.qualitativeStagingOverride, r.finalStage,
        ]);
        sheetName = "Stage Movement";
        break;
    }

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `ifrs9-${id}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const downloadPdf = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const date = new Date().toISOString().slice(0, 10);
    const pageW = 210;
    const margin = 20;

    // Header bar
    doc.setFillColor(200, 16, 46);
    doc.rect(0, 0, pageW, 18, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("IFRS 9 ECL Summary Report", margin, 12);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(date, pageW - margin - 22, 12);

    // Title block
    doc.setTextColor(26, 26, 46);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Expected Credit Loss Summary", margin, 32);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 120);
    doc.text("Debt-securities book - Board-level disclosure", margin, 39);

    // Divider
    doc.setDrawColor(220, 220, 230);
    doc.line(margin, 43, pageW - margin, 43);

    // Key metrics grid (2×2)
    const pdfCompact = (v: number) => {
      if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
      if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
      if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
      return v.toFixed(2);
    };
    const metrics = [
      { label: "Total Exposure (LCY)", value: pdfCompact(result.totals.exposureLcy) },
      { label: "Total ECL (LCY)",      value: pdfCompact(result.totals.impairmentLcy) },
      { label: "Coverage Ratio",        value: (result.totals.coverageRatio * 100).toFixed(3) + "%" },
      { label: "Instrument Count",      value: String(result.totals.instrumentCount) },
    ];
    const boxW = (pageW - margin * 2 - 6) / 2;
    metrics.forEach((m, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = margin + col * (boxW + 6);
      const y = 48 + row * 22;
      doc.setFillColor(247, 247, 248);
      doc.roundedRect(x, y, boxW, 18, 2, 2, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(130, 130, 150);
      doc.text(m.label.toUpperCase(), x + 4, y + 6);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(26, 26, 46);
      doc.text(m.value, x + 4, y + 14);
    });

    // Stage breakdown table
    let y = 105;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(26, 26, 46);
    doc.text("Stage Breakdown", margin, y);
    y += 5;

    // Columns: Stage | Count | Exposure | ECL | Coverage%
    // Widths:   35  |  20   |   40     |  40  |   35   = 170mm total
    const colX = [margin, margin + 35, margin + 55, margin + 95, margin + 135];
    const colW = [35, 20, 40, 40, 35];
    const tHeaders = ["Stage", "Count", "Exposure", "ECL", "Coverage %"];

    // Table header
    doc.setFillColor(200, 16, 46);
    doc.rect(margin, y, pageW - margin * 2, 7, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    tHeaders.forEach((h, i) => doc.text(h, colX[i] + 2, y + 5));
    y += 7;

    // Table rows
    result.byStage.forEach((s, idx) => {
      const bg = idx % 2 === 0 ? [255, 255, 255] : [247, 247, 248];
      doc.setFillColor(bg[0], bg[1], bg[2]);
      doc.rect(margin, y, pageW - margin * 2, 7, "F");
      doc.setTextColor(26, 26, 46);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      const vals = [
        `Stage ${s.stage}`,
        String(s.count),
        pdfCompact(s.exposure),
        pdfCompact(s.impairment),
        (s.coverageRatio * 100).toFixed(2) + "%",
      ];
      vals.forEach((v, i) => {
        if (i >= 1) {
          const tw = doc.getTextWidth(v);
          doc.text(v, colX[i] + colW[i] - tw - 2, y + 5);
        } else {
          doc.text(v, colX[i] + 2, y + 5);
        }
      });
      y += 7;
    });

    // Footer
    doc.setDrawColor(220, 220, 230);
    doc.line(margin, 275, pageW - margin, 275);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 180);
    doc.text("Generated by Leadway Quanta - Confidential", margin, 280);
    doc.text(`Page 1 of 1`, pageW - margin - 16, 280);

    doc.save(`ifrs9-ecl-summary-${date}.pdf`);
  };

  return (
    <div className="space-y-6 p-3 sm:p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-dark-gray">
          Reports
        </h1>
        <p className="mt-1 text-sm text-dark-gray/60">
          Generate IFRS 9 disclosures for the debt-securities book.
        </p>
      </div>

      <SectionCard title="Current Run">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-xs text-dark-gray/55">Total Exposure</p>
            <p className="mt-1 text-lg font-semibold text-dark-gray">
              {fmtCompact(result.totals.exposureLcy)}
            </p>
          </div>
          <div>
            <p className="text-xs text-dark-gray/55">Total ECL</p>
            <p className="mt-1 text-lg font-semibold text-deep-red">
              {fmtCompact(result.totals.impairmentLcy)}
            </p>
          </div>
          <div>
            <p className="text-xs text-dark-gray/55">Coverage Ratio</p>
            <p className="mt-1 text-lg font-semibold text-dark-gray">
              {fmtPct(result.totals.coverageRatio, 3)}
            </p>
          </div>
          <div>
            <p className="text-xs text-dark-gray/55">Instruments</p>
            <p className="mt-1 text-lg font-semibold text-dark-gray">
              {result.totals.instrumentCount}
            </p>
          </div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {REPORTS.map((r) => (
          <div
            key={r.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
          >
            <div className="flex items-start justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-pale-red text-primary">
                {r.icon}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-dark-gray">{r.title}</p>
              <p className="mt-1 text-xs text-dark-gray/60">{r.description}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="h-3.5 w-3.5" />}
              disabled={result.rows.length === 0}
              onClick={() => r.id === "summary" ? downloadPdf() : downloadXlsx(r.id)}
            >
              {r.id === "summary" ? "Download PDF" : "Download Excel"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

