import { useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  History,
  MessageSquare,
  Paperclip,
  Printer,
  X,
} from "lucide-react";
import { usePersona } from "../../../context/persona";
import { canDo } from "../../../context/platform-personas";
import { useWorkflow } from "../store";
import type { DealSlip } from "../types";
import { isEditableStatus } from "../engine/transitions";
import { DealSlipStatusHint } from "./status-badge";
import { DealSlipTimeline } from "./timeline";
import { ChecksPanel } from "./checks-panel";
import { SettlementPanel } from "./settlement-panel";
import { DealSlipDocument } from "./deal-slip-document";
import { downloadDealSlipPdf } from "../utils/download-deal-slip";

export function DealSlipWorkspace({
  dealId,
  onClose,
}: {
  dealId: string;
  onClose: () => void;
}) {
  const { persona } = usePersona();
  const wf = useWorkflow();
  const deal = wf.getDealSlip(dealId);
  const slipRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<"checks" | "settlement" | "audit" | "comments">("checks");
  const [workflowOpen, setWorkflowOpen] = useState(true);
  const [comment, setComment] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [msg, setMsg] = useState("");

  if (!deal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="rounded-xl bg-white p-6 shadow-xl">
          <p className="text-sm font-semibold text-dark-gray">Deal slip not found</p>
          <p className="mt-1 text-xs text-dark-gray/50">
            Reference <span className="font-mono">{dealId}</span> is not in the register.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const canEdit =
    isEditableStatus(deal.status) &&
    (canDo(persona.role, "dealSlip", "C") || deal.createdBy === persona.name);
  const canReview = canDo(persona.role, "checks", "R") || canDo(persona.role, "dealSlip", "R");
  const canApprove = canDo(persona.role, "approval", "A");

  const flash = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 3500);
  };

  const handlePrint = () => {
    const el = slipRef.current;
    if (!el) return;
    const win = window.open("", "_blank", "width=640,height=900");
    if (!win) return;
    win.document.write(
      `<!DOCTYPE html><html><head><title>${deal.id} Deal Slip</title>
      <style>body{margin:0;padding:24px;background:#f5f5f5;display:flex;justify-content:center}
      @media print{body{background:white;padding:0}}</style></head>
      <body>${el.outerHTML}</body></html>`,
    );
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6">
      <div className="flex h-full max-h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-[#FAFAFA] px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Deal slip</p>
            <p className="truncate font-mono text-sm font-bold text-dark-gray">{deal.id}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => downloadDealSlipPdf(deal)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-dark-gray shadow-sm hover:border-primary hover:text-primary"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-dark-gray shadow-sm hover:border-primary hover:text-primary"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-dark-gray/50 hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {msg && (
          <div className="shrink-0 border-b border-primary/20 bg-pale-red px-5 py-2 text-xs font-medium text-primary">
            {msg}
          </div>
        )}

        <div className="flex-1 overflow-y-auto bg-[#EDECEA] px-4 py-6 sm:px-8">
          <DealSlipDocument ref={slipRef} deal={deal} />
          <div className="mx-auto mt-4 max-w-[520px]">
            <DealSlipTimeline status={deal.status} />
            <div className="mt-2">
              <DealSlipStatusHint status={deal.status} />
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-border bg-white">
          <button
            type="button"
            onClick={() => setWorkflowOpen(!workflowOpen)}
            className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-gray-50/80"
          >
            <span className="text-sm font-semibold text-dark-gray">Workflow &amp; actions</span>
            {workflowOpen ? (
              <ChevronDown className="h-4 w-4 text-dark-gray/40" />
            ) : (
              <ChevronUp className="h-4 w-4 text-dark-gray/40" />
            )}
          </button>

          {workflowOpen && (
            <div className="border-t border-border px-5 pb-4">
              <div className="mb-3 flex gap-1 overflow-x-auto pt-3">
                {(
                  [
                    ["checks", History, "Checks"],
                    ["settlement", Paperclip, "Settlement"],
                    ["comments", MessageSquare, "Comments"],
                    ["audit", FileText, "Audit"],
                  ] as const
                ).map(([id, Icon, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    className={`flex shrink-0 items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold ${
                      tab === id
                        ? "bg-dark-gray text-white"
                        : "bg-gray-100 text-dark-gray/60 hover:bg-gray-200"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              <div className="max-h-48 overflow-y-auto">
                {tab === "checks" && (
                  <ChecksPanel
                    checks={deal.checks}
                    role={persona.role}
                    onClear={(checkId, fn) => {
                      const r = wf.clearCheck(deal.id, checkId, persona.name, persona.role, fn);
                      flash(r.ok ? "Check cleared." : r.error ?? "Failed");
                    }}
                  />
                )}
                {tab === "settlement" && (
                  <SettlementPanel
                    deal={deal}
                    role={persona.role}
                    user={persona.name}
                    onGenerate={(payload) => {
                      const r = wf.generateSettlementInstruction(
                        deal.id,
                        persona.name,
                        persona.role,
                        payload,
                      );
                      flash(r.ok ? "Instruction generated." : r.error ?? "Failed");
                    }}
                    onCheck={() => {
                      const r = wf.checkSettlementInstruction(deal.id, persona.name, persona.role);
                      flash(r.ok ? "Instruction checked." : r.error ?? "Failed");
                    }}
                    onConfirm={(outcome, reason) => {
                      const r = wf.confirmSettlement(
                        deal.id,
                        persona.name,
                        persona.role,
                        outcome,
                        reason,
                      );
                      flash(r.ok ? `Settlement: ${outcome}` : r.error ?? "Failed");
                    }}
                  />
                )}
                {tab === "comments" && (
                  <div className="space-y-2">
                    {deal.comments.map((c) => (
                      <div key={c.id} className="rounded-lg border border-border px-3 py-2 text-xs">
                        <div className="flex justify-between text-dark-gray/45">
                          <span>{c.user}</span>
                          <span>{c.at.slice(0, 10)}</span>
                        </div>
                        <p className="mt-1 text-dark-gray">{c.text}</p>
                      </div>
                    ))}
                    {canReview && (
                      <div className="flex gap-2">
                        <input
                          className="flex-1 rounded-lg border border-border px-2 py-1.5 text-sm"
                          placeholder="Add comment…"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!comment.trim()) return;
                            wf.addComment(deal.id, persona.name, persona.role, comment, "comment");
                            setComment("");
                          }}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Post
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {tab === "audit" && (
                  <ul className="space-y-1.5">
                    {deal.auditTrail.map((a) => (
                      <li key={a.id} className="rounded border border-border px-3 py-1.5 text-xs">
                        <span className="font-medium">{a.action}</span>
                        <span className="text-dark-gray/45">
                          {" "}
                          · {a.user} · {a.at.slice(0, 10)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                {canEdit && deal.status === "Draft" && (
                  <button
                    type="button"
                    onClick={() => {
                      const r = wf.submitDealSlip(deal.id, persona.name, persona.role);
                      flash(r.ok ? "Submitted for review." : r.error ?? "Failed");
                    }}
                    className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white"
                  >
                    Submit for review
                  </button>
                )}
                {canEdit && deal.status === "Returned for Amendment" && (
                  <button
                    type="button"
                    onClick={() => {
                      const r = wf.submitDealSlip(deal.id, persona.name, persona.role);
                      flash(r.ok ? "Resubmitted." : r.error ?? "Failed");
                    }}
                    className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white"
                  >
                    Resubmit
                  </button>
                )}
                {canReview && (deal.status === "Submitted" || deal.status === "Under Review") && (
                  <>
                    {deal.status === "Submitted" && (
                      <button
                        type="button"
                        onClick={() => {
                          const r = wf.startReview(deal.id, persona.name, persona.role);
                          flash(r.ok ? "Review started." : r.error ?? "Failed");
                        }}
                        className="rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary"
                      >
                        Start review
                      </button>
                    )}
                    <input
                      className="min-w-[100px] flex-1 rounded border border-border px-2 py-1 text-xs"
                      placeholder="Return reason…"
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        wf.returnForAmendment(deal.id, persona.name, persona.role, returnReason);
                        flash("Returned for amendment.");
                      }}
                      className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-800"
                    >
                      Return
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        wf.rejectDealSlip(deal.id, persona.name, persona.role, rejectReason);
                        flash("Deal rejected.");
                      }}
                      className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700"
                    >
                      Reject
                    </button>
                  </>
                )}
                {canApprove && deal.status === "Under Review" && (
                  <button
                    type="button"
                    onClick={() => {
                      const r = wf.approveDealSlip(deal.id, persona.name, persona.role);
                      flash(r.ok ? "Approved." : r.error ?? "Failed");
                    }}
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
                  >
                    Approve deal
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
