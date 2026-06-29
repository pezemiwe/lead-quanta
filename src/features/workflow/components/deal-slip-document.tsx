import { forwardRef } from "react";
import type { DealSlip } from "../types";
import { MANDATORY_FIELDS } from "../engine/fields";
import { dealNotional, dealSlipLabel } from "../engine/fields";
import { DealSlipStatusBadge } from "./status-badge";

function fmtNotional(n: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}

export const DealSlipDocument = forwardRef<HTMLDivElement, { deal: DealSlip }>(
  function DealSlipDocument({ deal }, ref) {
    const fields = MANDATORY_FIELDS[deal.assetClass];
    const notional = dealNotional(deal.fields);

    return (
      <div
        ref={ref}
        className="deal-slip-print mx-auto w-full max-w-[520px] bg-[#FFFDF8] shadow-[0_4px_24px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.06)]"
        style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
      >
        {/* Perforated tear strip */}
        <div
          className="relative h-3 bg-[#F7941D]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent, transparent 6px, rgba(255,255,255,0.35) 6px, rgba(255,255,255,0.35) 12px)",
          }}
        />

        <div className="border-x border-b border-[#E8E4DC] px-6 pb-6 pt-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-dashed border-[#D4CFC4] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <img
                  src="/lead-logo.jpg"
                  alt=""
                  className="h-8 w-8 rounded-full border border-[#E8E4DC]"
                />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F7941D]">
                    Leadway Quanta
                  </p>
                  <p className="text-[9px] uppercase tracking-widest text-[#8A8578]">
                    Investment deal slip
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p
                className="font-mono text-lg font-bold tracking-tight text-[#2C2C2C]"
                style={{ fontFamily: "ui-monospace, monospace" }}
              >
                {deal.id}
              </p>
              <p className="mt-0.5 text-[10px] text-[#8A8578]">
                v{deal.version} · {deal.createdAt.slice(0, 10)}
              </p>
            </div>
          </div>

          {/* Title block */}
          <div className="mt-4">
            <h2 className="text-base font-bold leading-snug text-[#1A1A1A]">
              {dealSlipLabel(deal.fields, deal.assetClass)}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <DealSlipStatusBadge status={deal.status} />
              <span className="text-[11px] text-[#6B6560]">{deal.portfolioName}</span>
              <span className="text-[#D4CFC4]">·</span>
              <span className="text-[11px] text-[#6B6560]">{deal.assetClass}</span>
            </div>
          </div>

          {/* Amount highlight */}
          <div className="mt-4 rounded border border-[#F7941D]/30 bg-[#FFF7ED] px-4 py-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#B45309]">
              Notional amount
            </p>
            <p
              className="mt-0.5 text-2xl font-bold tabular-nums text-[#1A1A1A]"
              style={{ fontFamily: "ui-monospace, monospace" }}
            >
              {fmtNotional(notional)}
            </p>
          </div>

          {/* Meta grid */}
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-b border-dashed border-[#D4CFC4] pb-4 text-[11px]">
            {[
              ["Originator", deal.createdBy],
              ["Desk", deal.createdByRole],
              ["Submitted", deal.submittedAt?.slice(0, 10) ?? "—"],
              ["Approved by", deal.approvedBy ?? "—"],
              ["Settlement", deal.settlementStatus ?? "—"],
              ["Register ref", deal.registerPositionId ?? "—"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[9px] font-bold uppercase tracking-wide text-[#8A8578]">
                  {label}
                </dt>
                <dd className="mt-0.5 font-medium text-[#2C2C2C]">{value}</dd>
              </div>
            ))}
          </dl>

          {/* Field table */}
          <div className="mt-4">
            <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-[#8A8578]">
              Economics &amp; terms
            </p>
            <table className="w-full border-collapse text-[11px]">
              <tbody>
                {fields.map((f) => (
                  <tr key={f.key} className="border-b border-[#EDE9E0]">
                    <td className="w-[42%] py-2 pr-3 align-top text-[#6B6560]">{f.label}</td>
                    <td
                      className="py-2 align-top font-semibold text-[#1A1A1A]"
                      style={{ fontFamily: "ui-monospace, monospace", fontSize: "10px" }}
                    >
                      {deal.fields[f.key] || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {deal.documents.length > 0 && (
            <div className="mt-4 border-t border-dashed border-[#D4CFC4] pt-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#8A8578]">
                Attachments
              </p>
              <ul className="mt-1 space-y-0.5">
                {deal.documents.map((d) => (
                  <li key={d.id} className="text-[10px] text-[#4A4540]">
                    ◦ {d.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Signature lines */}
          <div className="mt-6 grid grid-cols-2 gap-6 border-t border-[#D4CFC4] pt-5">
            <div>
              <div className="border-b border-[#2C2C2C] pb-8" />
              <p className="mt-1 text-[9px] uppercase tracking-wide text-[#8A8578]">
                Trader / Originator
              </p>
              <p className="text-[10px] font-medium text-[#4A4540]">{deal.createdBy}</p>
            </div>
            <div>
              <div className="border-b border-[#2C2C2C] pb-8" />
              <p className="mt-1 text-[9px] uppercase tracking-wide text-[#8A8578]">
                Authorised approval
              </p>
              <p className="text-[10px] font-medium text-[#4A4540]">
                {deal.approvedBy ?? "Pending"}
              </p>
            </div>
          </div>

          <p className="mt-4 text-center text-[8px] leading-relaxed text-[#A8A29E]">
            System-generated deal slip · Leadway Holdings · For internal use · CBN workflow compliant
          </p>
        </div>

        {/* Bottom perforation */}
        <div
          className="h-2 bg-[#F5F2EB]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 6px 0, transparent 4px, #E8E4DC 4px)",
            backgroundSize: "12px 8px",
            backgroundRepeat: "repeat-x",
          }}
        />
      </div>
    );
  },
);
