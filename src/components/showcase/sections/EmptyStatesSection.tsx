import { EmptyState, SectionCard, Button } from "../..";
import { S } from "../helpers";

const PRESETS = ["no-data", "no-results", "no-files", "not-run"] as const;

const PRESET_TITLES: Record<(typeof PRESETS)[number], string> = {
  "no-data": "No data available",
  "no-results": "No results found",
  "no-files": "No files uploaded",
  "not-run": "Model not yet run",
};

export function EmptyStatesSection() {
  return (
    <S label="Empty States">
      <div className="grid gap-4 sm:grid-cols-2">
        {PRESETS.map((p) => (
          <SectionCard key={p}>
            <EmptyState
              preset={p}
              title={PRESET_TITLES[p]}
              description="Upload your data to get started."
              action={
                <Button size="sm" variant="outline">
                  Upload now
                </Button>
              }
            />
          </SectionCard>
        ))}
      </div>
      <SectionCard title="Compact mode">
        <EmptyState
          preset="no-results"
          title="No matching records"
          description="Try clearing your filters."
          compact
        />
      </SectionCard>
    </S>
  );
}
