import type { ReactNode } from "react";
import { Modal } from "./modal";

export type DetailField = {
  label: string;
  value: ReactNode;
  /** Span full width instead of half */
  wide?: boolean;
};

type RowDetailModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  fields: DetailField[];
};

export function RowDetailModal({
  isOpen,
  onClose,
  title,
  subtitle,
  fields,
}: RowDetailModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      {subtitle && <p className="mb-4 text-sm text-dark-gray/60">{subtitle}</p>}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
        {fields.map((f, i) => (
          <div key={i} className={f.wide ? "col-span-2" : "col-span-1"}>
            <dt className="text-xs font-medium uppercase tracking-wide text-dark-gray/50">
              {f.label}
            </dt>
            <dd className="mt-1 text-sm font-medium text-dark-gray break-words">
              {f.value ?? <span className="text-dark-gray/30">—</span>}
            </dd>
          </div>
        ))}
      </dl>
    </Modal>
  );
}
