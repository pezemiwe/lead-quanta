import { ShieldCheck, AlertTriangle, Lock, Eye } from "lucide-react";
import { usePersona } from "../../context/persona";
import {
  useGovernance,
  type Permission,
} from "../../context/governance";
import { Link } from "react-router-dom";

interface GovernanceBarProps {
  /** Which permission is required to interact (not just view) this page */
  requiredPermission?: Permission;
  /** Maker / checker context label for this page */
  context?: "maker" | "checker" | "reviewer";
  /** Custom message to show alongside the role info */
  contextNote?: string;
  /** If true, show a pending approval count badge */
  showPendingApprovals?: boolean;
}

const CONTEXT_META = {
  maker: { label: "Maker", colour: "bg-blue-50 border-blue-200 text-blue-800" },
  checker: {
    label: "Checker",
    colour: "bg-emerald-50 border-emerald-200 text-emerald-800",
  },
  reviewer: {
    label: "Read-only",
    colour: "bg-gray-50 border-gray-200 text-gray-600",
  },
};

const TIER_STYLES: Record<string, string> = {
  admin: "bg-primary/10 border-primary/30 text-primary",
  checker: "bg-emerald-50 border-emerald-200 text-emerald-800",
  maker: "bg-blue-50 border-blue-200 text-blue-800",
  viewer: "bg-gray-50 border-gray-200 text-gray-600",
};

export function GovernanceBar({
  requiredPermission,
  context,
  contextNote,
  showPendingApprovals = false,
}: GovernanceBarProps) {
  const { persona } = usePersona();
  const { hasPermission, getTier, pendingCount } = useGovernance();

  if (!persona.name) return null;

  const tier = getTier(persona.role);
  const canAct = requiredPermission
    ? hasPermission(persona.role, requiredPermission)
    : true;
  const tierStyle = TIER_STYLES[tier] ?? TIER_STYLES.viewer;
  const displayContext =
    context ??
    (tier === "admin" || tier === "checker"
      ? "checker"
      : tier === "maker"
        ? "maker"
        : "reviewer");
  const ctxMeta = CONTEXT_META[displayContext];

  return (
    <div
      className={`mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 rounded-lg border px-3 py-2.5 sm:px-4 text-sm ${
        !canAct ? "border-amber-200 bg-amber-50/60" : "border-border bg-surface"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* User pill */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {persona.avatar || persona.name.slice(0, 2).toUpperCase()}
          </div>
          <span className="font-medium text-dark-gray">{persona.name}</span>
          <span className="text-dark-gray/50">·</span>
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${tierStyle}`}
          >
            {persona.role}
          </span>
        </div>

        {/* Context badge */}
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${ctxMeta.colour}`}
        >
          {ctxMeta.label}
        </span>

        {/* Note */}
        {contextNote && (
          <span className="text-xs text-dark-gray/60">{contextNote}</span>
        )}

        {/* Access warning */}
        {!canAct && (
          <span className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
            <Lock className="h-3.5 w-3.5" />
            Insufficient permissions — view only
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Pending approvals */}
        {showPendingApprovals && pendingCount > 0 && (
          <Link
            to="/governance/approvals"
            className="flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            {pendingCount} pending approval{pendingCount !== 1 ? "s" : ""}
          </Link>
        )}
        <Link
          to="/governance/audit-log"
          className="flex items-center gap-1.5 text-xs text-dark-gray/50 hover:text-primary transition-colors"
        >
          <Eye className="h-3.5 w-3.5" />
          Audit log
        </Link>
      </div>
    </div>
  );
}
