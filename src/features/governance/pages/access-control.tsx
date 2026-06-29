import { ShieldCheck } from "lucide-react";
import { SectionCard } from "../../../components/shared/section-card";
import { Badge } from "../../../components/shared/badge";
import {
  PERSONA_ACCESS,
  type PersonaRole,
  type PlatformCapability,
} from "../../../context/platform-personas";
import { getPersonaTier } from "../../../context/platform-personas";

const CAPABILITIES: PlatformCapability[] = [
  "blotter",
  "dealSlip",
  "checks",
  "approval",
  "settle",
  "register",
  "accrual",
  "valuation",
  "limits",
  "acctGl",
  "reports",
  "auditAdmin",
];

const ROLES = Object.keys(PERSONA_ACCESS) as PersonaRole[];

export function AccessControl() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-dark-gray">Access control</h1>
        <p className="text-sm text-dark-gray/55">
          Canonical persona capability matrix — C/R/A/S/P/M/V per platform capability.
        </p>
      </div>

      <SectionCard title="Feature access matrix">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead>
              <tr className="border-b border-border text-dark-gray/45">
                <th className="py-2 pr-4 font-semibold">Persona</th>
                <th className="py-2 pr-4 font-semibold">Tier</th>
                {CAPABILITIES.map((c) => (
                  <th key={c} className="px-1 py-2 font-semibold capitalize">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROLES.map((role) => (
                <tr key={role} className="border-b border-border/60">
                  <td className="py-2 pr-4 font-medium text-dark-gray">{role}</td>
                  <td className="py-2 pr-4">
                    <Badge variant="neutral" size="sm">
                      {getPersonaTier(role)}
                    </Badge>
                  </td>
                  {CAPABILITIES.map((cap) => {
                    const actions = PERSONA_ACCESS[role][cap];
                    return (
                      <td key={cap} className="px-1 py-2 text-center text-[10px] text-dark-gray/70">
                        {actions?.join("") ?? "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[10px] text-dark-gray/40">
          C=Create · R=Review · A=Approve · S=Settle · P=Post · M=Maintain · V=View
        </p>
      </SectionCard>

      <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-pale-red/40 px-4 py-3 text-xs text-dark-gray/60">
        <ShieldCheck className="h-4 w-4 text-primary" />
        Workflow actions are enforced in deal slip workspace, settlement panel, and module guards.
      </div>
    </div>
  );
}
