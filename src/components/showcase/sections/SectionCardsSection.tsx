import { SectionCard, Button } from "../..";
import { S } from "../helpers";
import { Download } from "lucide-react";

export function SectionCardsSection() {
  return (
    <S label="Section Cards">
      <SectionCard
        title="Portfolio Summary"
        description="Aggregated ECL metrics for December 2024"
        actions={
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Download className="h-3.5 w-3.5" />}
          >
            Export
          </Button>
        }
      >
        <p className="text-sm text-dark-gray/55">
          Card body content tables, charts, or any other content.
        </p>
      </SectionCard>
      <SectionCard noPadding>
        <div className="px-5 py-4 text-sm text-dark-gray/55">
          Card with{" "}
          <code className="rounded bg-slate-100 px-1 text-xs font-mono">
            noPadding
          </code>{" "}
          useful for full-width table borders.
        </div>
      </SectionCard>
      <SectionCard>
        <p className="text-sm text-dark-gray/55">
          Card without header just content.
        </p>
      </SectionCard>
    </S>
  );
}
