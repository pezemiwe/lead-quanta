import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Assumptions, Instrument } from "../valuation/engine/types";
import { DEFAULT_ASSUMPTIONS } from "../valuation/engine/reference-data";
import { BOOK_INSTRUMENTS } from "../portfolio/engine/instrument-book";
import { parseInstrumentsCSV } from "../valuation/engine/parsing";
import {
  buildCashflowProjection,
  buildConvexityCurve,
  buildDurationHistogram,
  buildDurationTable,
  buildStressTable,
  computeALMGap,
  computeRiskTotals,
  rollupByClassification,
  rollupBySector,
  rollupByType,
  runCurveScenarios,
  runNigerianScenarios,
} from "./engine";
import type {
  ALMResult,
  ByGroupRow,
  CashflowBucketRow,
  ConvexityCurvePoint,
  DurationHistogramRow,
  DurationRow,
  LiabilityBucket,
  RiskTotals,
  ScenarioImpact,
  StressRow,
} from "./engine/types";
import { DEFAULT_LIABILITY_STRUCTURE } from "./engine/reference-data";

interface RiskResult {
  durationRows: DurationRow[];
  stressRows: StressRow[];
  cashflowBuckets: CashflowBucketRow[];
  curveScenarios: ScenarioImpact[];
  nigerianScenarios: ScenarioImpact[];
  alm: ALMResult;
  bySector: ByGroupRow[];
  byType: ByGroupRow[];
  byClassification: ByGroupRow[];
  totals: RiskTotals;
  durationHistogram: DurationHistogramRow[];
  convexityCurve: ConvexityCurvePoint[];
}

interface DurationRiskContextValue {
  instruments: Instrument[];
  assumptions: Assumptions;
  liabilities: LiabilityBucket[];
  result: RiskResult;
  hasData: boolean;
  lastUploadedFile: string | null;
  parseErrors: { row: number; message: string }[];

  setAssumptions: (a: Assumptions) => void;
  setLiabilities: (l: LiabilityBucket[]) => void;
  loadSample: () => void;
  loadFromCSV: (
    text: string,
    fileName?: string,
  ) => {
    ok: boolean;
    count: number;
    errors: { row: number; message: string }[];
  };
  clear: () => void;
}

const Ctx = createContext<DurationRiskContextValue | null>(null);

export function DurationRiskProvider({ children }: { children: ReactNode }) {
  const [instruments, setInstruments] =
    useState<Instrument[]>(BOOK_INSTRUMENTS);
  const [assumptions, setAssumptions] =
    useState<Assumptions>(DEFAULT_ASSUMPTIONS);
  const [liabilities, setLiabilities] = useState<LiabilityBucket[]>(
    DEFAULT_LIABILITY_STRUCTURE,
  );
  const [lastUploadedFile, setLastUploadedFile] = useState<string | null>(
    `Portfolio Book (${BOOK_INSTRUMENTS.length} instruments)`,
  );
  const [parseErrors, setParseErrors] = useState<
    { row: number; message: string }[]
  >([]);

  const result = useMemo<RiskResult>(() => {
    const durationRows = buildDurationTable(instruments, assumptions);
    const stressRows = buildStressTable(instruments, durationRows, assumptions);
    const cashflowBuckets = buildCashflowProjection(instruments, assumptions);
    const curveScenarios = runCurveScenarios(
      instruments,
      durationRows,
      assumptions,
    );
    const nigerianScenarios = runNigerianScenarios(
      instruments,
      durationRows,
      assumptions,
    );
    const alm = computeALMGap(durationRows, liabilities);
    const totals = computeRiskTotals(durationRows, stressRows);
    return {
      durationRows,
      stressRows,
      cashflowBuckets,
      curveScenarios,
      nigerianScenarios,
      alm,
      bySector: rollupBySector(durationRows),
      byType: rollupByType(durationRows),
      byClassification: rollupByClassification(durationRows),
      totals,
      durationHistogram: buildDurationHistogram(durationRows),
      convexityCurve: buildConvexityCurve(stressRows),
    };
  }, [instruments, assumptions, liabilities]);

  const value: DurationRiskContextValue = {
    instruments,
    assumptions,
    liabilities,
    result,
    hasData: instruments.length > 0,
    lastUploadedFile,
    parseErrors,
    setAssumptions,
    setLiabilities,
    loadSample: () => {
      setInstruments(BOOK_INSTRUMENTS);
      setLastUploadedFile(
        `Portfolio Book (${BOOK_INSTRUMENTS.length} instruments)`,
      );
      setParseErrors([]);
    },
    loadFromCSV: (text, fileName) => {
      const { instruments: parsed, errors } = parseInstrumentsCSV(text);
      setInstruments(parsed);
      setLastUploadedFile(fileName ?? "uploaded.csv");
      setParseErrors(errors);
      return { ok: parsed.length > 0, count: parsed.length, errors };
    },
    clear: () => {
      setInstruments([]);
      setLastUploadedFile(null);
      setParseErrors([]);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDurationRisk(): DurationRiskContextValue {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useDurationRisk must be used within DurationRiskProvider");
  return ctx;
}
