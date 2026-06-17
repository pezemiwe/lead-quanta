import { Tabs } from "../..";
import { S, Row } from "../helpers";
import { PORTFOLIO_TABS } from "../data";

interface Props {
  tabVal: string;
  setTabVal: (v: string) => void;
  pillVal: string;
  setPillVal: (v: string) => void;
}

export function TabsSection({ tabVal, setTabVal, pillVal, setPillVal }: Props) {
  return (
    <S label="Tabs">
      <Row label="Underline variant">
        <div className="w-full">
          <Tabs
            tabs={PORTFOLIO_TABS}
            value={tabVal}
            onChange={setTabVal}
            variant="underline"
          />
          <div className="mt-4 rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-dark-gray/40">
            Active tab: <strong className="text-primary">{tabVal}</strong>
          </div>
        </div>
      </Row>
      <Row label="Pill variant">
        <Tabs
          tabs={PORTFOLIO_TABS}
          value={pillVal}
          onChange={setPillVal}
          variant="pill"
        />
      </Row>
      <Row label="Sizes">
        <Tabs
          tabs={[
            { value: "a", label: "Small" },
            { value: "b", label: "Tabs" },
            { value: "c", label: "Here" },
          ]}
          value="a"
          onChange={() => {}}
          size="sm"
          variant="underline"
        />
        <Tabs
          tabs={[
            { value: "a", label: "Large" },
            { value: "b", label: "Tabs" },
            { value: "c", label: "Here" },
          ]}
          value="b"
          onChange={() => {}}
          size="lg"
          variant="pill"
        />
      </Row>
    </S>
  );
}
