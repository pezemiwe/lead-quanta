import jsPDF from "jspdf";
import type { DealSlip } from "../types";
import { MANDATORY_FIELDS } from "../engine/fields";
import { dealNotional, dealSlipLabel } from "../engine/fields";

function fmtMoney(n: number): string {
  return `NGN ${n.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
}

export function downloadDealSlipPdf(deal: DealSlip): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 14;
  const pageW = doc.internal.pageSize.getWidth();
  let y = margin;

  const orange: [number, number, number] = [247, 148, 29];
  const gray: [number, number, number] = [100, 100, 100];

  doc.setFillColor(...orange);
  doc.rect(0, 0, pageW, 8, "F");
  y = 16;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...gray);
  doc.text("LEADWAY QUANTA · INVESTMENT DEAL SLIP", margin, y);
  y += 6;

  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text(dealSlipLabel(deal.fields, deal.assetClass), margin, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...orange);
  doc.text(deal.id, margin, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...gray);
  doc.text(`Status: ${deal.status}`, margin + 42, y);
  y += 7;

  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  const meta: [string, string][] = [
    ["Portfolio", deal.portfolioName],
    ["Asset class", deal.assetClass],
    ["Created by", `${deal.createdBy} (${deal.createdByRole})`],
    ["Created", deal.createdAt.slice(0, 10)],
    ["Notional", fmtMoney(dealNotional(deal.fields))],
    ["Submitted", deal.submittedAt?.slice(0, 10) ?? "—"],
    ["Approved by", deal.approvedBy ?? "—"],
    ["Settlement", deal.settlementStatus ?? "—"],
  ];

  doc.setFontSize(9);
  for (const [label, value] of meta) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...gray);
    doc.text(label, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    const lines = doc.splitTextToSize(value, pageW - margin - 52) as string[];
    doc.text(lines, margin + 48, y);
    y += Math.max(5, lines.length * 4.5);
  }

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.text("Economics & terms", margin, y);
  y += 5;

  const fields = MANDATORY_FIELDS[deal.assetClass];
  doc.setFontSize(8.5);
  for (const f of fields) {
    if (y > 265) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...gray);
    doc.text(f.label, margin, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    const val = deal.fields[f.key] || "—";
    const valLines = doc.splitTextToSize(val, pageW - margin - 55) as string[];
    doc.text(valLines, margin + 52, y);
    y += Math.max(5, valLines.length * 4);
    doc.setDrawColor(240, 240, 240);
    doc.line(margin, y - 1, pageW - margin, y - 1);
  }

  y += 8;
  if (y > 250) {
    doc.addPage();
    y = margin;
  }

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(...gray);
  doc.text(
    "This deal slip is system-generated from Leadway Quanta. Official records are maintained in the investment register after approved settlement.",
    margin,
    y,
    { maxWidth: pageW - margin * 2 },
  );
  y += 12;

  const sigY = Math.min(y + 10, 270);
  doc.setDrawColor(180, 180, 180);
  doc.line(margin, sigY, margin + 55, sigY);
  doc.line(margin + 75, sigY, margin + 130, sigY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text("Trader / Originator", margin, sigY + 4);
  doc.text("Authorised signatory", margin + 75, sigY + 4);

  doc.save(`${deal.id}-deal-slip.pdf`);
}
