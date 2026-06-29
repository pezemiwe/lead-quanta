import { PageHeader, FilterPopover, Select, DataTable } from "../..";
import { S } from "../helpers";
import { LOAN_ROWS, LOAN_COLS } from "../data";

interface Props {
  filterClose: number;
  setFilterClose: React.Dispatch<React.SetStateAction<number>>;
}

export function TablesSection({ filterClose, setFilterClose }: Props) {
  return (
    <S label="Tables">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
        <PageHeader
          title="Investment Book"
          description="December 2024 snapshot — 5 records"
          className="pb-0"
        />
        <FilterPopover
          closeSignal={filterClose}
          onApply={() => setFilterClose((v) => v + 1)}
          onReset={() => {}}
        >
          <div className="space-y-3">
            <Select
              label="Classification"
              options={[
                { value: "AC", label: "Amortised Cost" },
                { value: "FVOCI", label: "Fair Value (OCI)" },
                { value: "FVTPL", label: "Fair Value (P&L)" },
              ]}
              placeholder="All classifications"
            />
            <Select
              label="Status"
              options={[
                { value: "p", label: "Performing" },
                { value: "w", label: "Watch" },
              ]}
              placeholder="All statuses"
            />
          </div>
        </FilterPopover>
      </div>
      <DataTable
        columns={LOAN_COLS}
        data={LOAN_ROWS}
        keyExtractor={(r) => r.id}
      />
      <div className="mt-4">
        <DataTable
          columns={LOAN_COLS}
          data={[]}
          keyExtractor={(r) => r.id}
          emptyMessage="No loans found"
          emptyDescription="Adjust your filters or upload an investment book to get started."
        />
      </div>
    </S>
  );
}
