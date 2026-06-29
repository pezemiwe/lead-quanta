import { Badge } from "../../../components/shared/badge";
import type { DealSlipStatus } from "../types";
import { STATUS_META } from "../engine/transitions";

type StatusColor = "neutral" | "info" | "warning" | "success" | "danger";

const VARIANT: Record<StatusColor, "neutral" | "info" | "warning" | "success" | "danger"> = {
  neutral: "neutral",
  info: "info",
  warning: "warning",
  success: "success",
  danger: "danger",
};

export function DealSlipStatusBadge({ status }: { status: DealSlipStatus }) {
  const meta = STATUS_META[status];
  return (
    <Badge variant={VARIANT[meta.color]} size="sm">
      {status}
    </Badge>
  );
}

export function DealSlipStatusHint({ status }: { status: DealSlipStatus }) {
  const meta = STATUS_META[status];
  return (
    <p className="text-xs text-dark-gray/55">
      <span className="font-medium text-dark-gray/70">{meta.meaning}.</span> {meta.rule}
    </p>
  );
}
