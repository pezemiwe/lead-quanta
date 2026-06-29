import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { SectionCard } from "../../../components/shared/section-card";
import { Badge } from "../../../components/shared/badge";
import { useWorkflow } from "../../workflow/store";
import { usePersona } from "../../../context/persona";

export function WorkflowExceptions() {
  const { exceptions, closeException } = useWorkflow();
  const { persona } = usePersona();
  const [closure, setClosure] = useState<Record<string, string>>({});

  const open = exceptions.filter((e) => e.status !== "closed");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-dark-gray">Exceptions</h1>
        <p className="text-sm text-dark-gray/55">
          Breaches, settlement mismatches and partial settlements remain visible until assigned, approved and closed.
        </p>
      </div>

      <SectionCard title="Open exceptions">
        {open.length === 0 ? (
          <p className="py-8 text-center text-sm text-dark-gray/45">No open exceptions.</p>
        ) : (
          <ul className="divide-y divide-border">
            {open.map((ex) => (
              <li key={ex.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-dark-gray">{ex.type}</span>
                      <Badge variant="warning" size="sm">
                        {ex.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-dark-gray/60">{ex.description}</p>
                    <p className="mt-1 text-xs text-dark-gray/40">
                      Deal {ex.dealSlipId} · Owner: {ex.owner} · Due: {ex.dueDate}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    className="flex-1 rounded-lg border border-border px-2 py-1.5 text-sm"
                    placeholder="Closure comment…"
                    value={closure[ex.id] ?? ""}
                    onChange={(e) => setClosure((c) => ({ ...c, [ex.id]: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      closeException(ex.id, closure[ex.id] || `Closed by ${persona.name}`);
                    }}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Close
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
