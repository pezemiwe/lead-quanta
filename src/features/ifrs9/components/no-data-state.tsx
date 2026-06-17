import { Database, Upload } from "lucide-react";
import { Button } from "../../../components/shared/button";

interface Props {
  onGoToDataManager: () => void;
}

export function NoDataState({ onGoToDataManager }: Props) {
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3 p-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-pale-red text-primary">
        <Database className="h-6 w-6" />
      </span>
      <h2 className="text-lg font-semibold text-dark-gray">
        No portfolio loaded
      </h2>
      <p className="max-w-md text-sm text-dark-gray/60">
        Upload your debt-securities CSV in the Data Manager, or load the sample
        portfolio to explore the IFRS 9 & ECL engine.
      </p>
      <Button
        variant="primary"
        size="sm"
        leftIcon={<Upload className="h-3.5 w-3.5" />}
        onClick={onGoToDataManager}
      >
        Go to Data Manager
      </Button>
    </div>
  );
}
