import { Loader, Skeleton, SkeletonRow, FileUploadLoader, Button } from "../..";
import { S, Row } from "../helpers";

interface Props {
  fileProgress: number;
  setFileProgress: (v: number) => void;
}

export function LoadersSection({ fileProgress, setFileProgress }: Props) {
  return (
    <S label="Loaders & Skeletons">
      <Row label="Spinner sizes">
        {(["xs", "sm", "md", "lg", "xl"] as const).map((s) => (
          <Loader key={s} size={s} />
        ))}
      </Row>
      <Row label="Skeleton blocks">
        <div className="w-full max-w-sm space-y-2">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-3/4 rounded-md" />
          <Skeleton className="h-4 w-1/2 rounded-md" />
        </div>
      </Row>
      <Row label="Skeleton table row">
        <div className="w-full">
          <SkeletonRow cols={5} />
        </div>
      </Row>
      <Row label="File upload progress">
        <div className="w-full max-w-md space-y-3">
          <FileUploadLoader
            fileName="historical-loan-book.csv"
            progress={fileProgress}
            tone="neutral"
          />
          <FileUploadLoader
            fileName="macro-scenarios.csv"
            progress={100}
            tone="success"
          />
          <FileUploadLoader
            fileName="collateral-data.xlsx"
            progress={62}
            tone="error"
          />
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setFileProgress(Math.max(0, fileProgress - 10))}
            >
              −10%
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setFileProgress(Math.min(100, fileProgress + 10))}
            >
              +10%
            </Button>
          </div>
        </div>
      </Row>
    </S>
  );
}
