import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Check } from "lucide-react";

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export type StepStatus = "pending" | "active" | "completed" | "error";
export type Step = {
  id: string;
  label: string;
  description?: string;
  status: StepStatus;
};

const stepCls: Record<StepStatus, { circle: string; label: string }> = {
  pending: {
    circle: "border-2 border-border bg-surface text-dark-gray/35",
    label: "text-dark-gray/45",
  },
  active: {
    circle: "border-2 border-primary bg-pale-red text-primary",
    label: "font-semibold text-dark-gray",
  },
  completed: {
    circle: "border-2 border-primary bg-primary text-white",
    label: "text-dark-gray",
  },
  error: {
    circle: "border-2 border-danger bg-red-50 text-danger",
    label: "text-danger",
  },
};

type ProgressStepsProps = {
  steps: Step[];
  orientation?: "horizontal" | "vertical";
  className?: string;
};

export const ProgressSteps = ({
  steps,
  orientation = "horizontal",
  className,
}: ProgressStepsProps) => {
  if (orientation === "vertical") {
    return (
      <ol className={cn("flex flex-col gap-0", className)}>
        {steps.map((step, i) => {
          const last = i === steps.length - 1;
          const cls = stepCls[step.status];
          return (
            <li key={step.id} className="relative flex gap-4">
              {!last && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-3.75 top-8 h-[calc(100%-8px)] w-0.5",
                    step.status === "completed" ? "bg-primary" : "bg-border",
                  )}
                />
              )}
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                  cls.circle,
                )}
                aria-hidden="true"
              >
                {step.status === "completed" ? (
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                ) : (
                  i + 1
                )}
              </span>
              <div className="min-w-0 pb-6">
                <p className={cn("text-sm", cls.label)}>{step.label}</p>
                {step.description && (
                  <p className="mt-0.5 text-xs text-dark-gray/45">
                    {step.description}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol className={cn("flex items-center", className)}>
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        const cls = stepCls[step.status];
        return (
          <li key={step.id} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-2">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                  cls.circle,
                )}
                aria-hidden="true"
              >
                {step.status === "completed" ? (
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                ) : (
                  i + 1
                )}
              </span>
              <span className={cn("whitespace-nowrap text-[11px]", cls.label)}>
                {step.label}
              </span>
            </div>
            {!last && (
              <span
                aria-hidden="true"
                className={cn(
                  "mb-5 h-0.5 flex-1",
                  step.status === "completed" ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
};
