export type AssetSpecification =
  | "Corporate"
  | "Sovereign FCY"
  | "Sovereign LCY";

export type PerformanceStatus =
  | "Performing"
  | "Watchlist"
  | "Substandard"
  | "Doubtful"
  | "Loss"
  | "Default";

export type CouponFrequency =
  | "MONTHLY"
  | "QUARTERLY"
  | "SEMI-ANNUALLY"
  | "HALF-YEARLY"
  | "ANNUALLY"
  | "YEARLY"
  | "BULLET";

export type RatingAgency =
  | "Moody's"
  | "S&P"
  | "Fitch"
  | "GCR"
  | "Agusto"
  | "Datapro";

export type Stage = 1 | 2 | 3;

export interface Security {
  sn: number;
  counterparty: string;
  currency: string;
  assetSpecification: AssetSpecification;
  purchaseConsiderationAcy: number;
  purchaseConsiderationLcy: number;
  redemptionValueAcy: number;
  redemptionValueLcy: number;
  carryingAmountAcy: number;
  fxRate: number;
  carryingAmountLcy: number;
  collateralAmount: number;
  collateralType: string;
  originationDate: Date;
  maturityDate: Date;
  lastCouponDate: Date;
  /** Annualised EIR as fraction, e.g. 0.0713 = 7.13% */
  eir: number;
  /** Annualised coupon rate as fraction */
  couponRate: number;
  ratingAtOriginationDate: string;
  ratingAgencyAtOriginationDate: RatingAgency | string;
  ratingAtReportingDate: string;
  ratingAgencyAtReportingDate: RatingAgency | string;
  couponRepayment: CouponFrequency;
  performanceStatus: PerformanceStatus;
  daysPastDue: number;
  /** 0 = no override, otherwise 1|2|3 stage override */
  qualitativeStagingOverride: number;
}

export interface Assumptions {
  reportingDate: Date;
  /** Sovereign recovery rate as fraction (e.g. 0.53) */
  sovereignRecoveryRate: number;
  /** FLI overlays per scenario, 60 months */
  baseline: number[];
  bestCase: number[];
  worseCase: number[];
  /** Probability weights for scenarios; should sum to ~1 */
  weights: {
    baseline: number;
    bestCase: number;
    worseCase: number;
  };
}

export interface SecurityComputed extends Security {
  /** Months to maturity at reporting date */
  ttm: number;
  /** Monthly EIR */
  meir: number;
  /** Monthly coupon rate */
  mcir: number;
  /** Months since last coupon */
  lcd: number;
  /** Stage from DPD only */
  dpdStage: Stage;
  /** Stage from performance status only */
  performanceStage: Stage;
  /** Stage from expiry / lifetime indicator */
  expiryStage: Stage | null;
  /** Worst of dpd/perf/expiry */
  modelStage: Stage;
  /** modelStage unless qualitative override > 0 */
  finalStage: Stage;
  /** Rating mapped through Moody (Corporate) or S&P (Sovereign) scale */
  ratingEquivalent: string;
  /** Recovery-rate bucket label */
  rrRating: string;
  /** Monthly PD vector (length = horizon months) */
  pd: number[];
  /** Annual LGD vector (length = 5 years) */
  lgd: number[];
  /** Monthly EAD projection vector (length = TTM) */
  ead: number[];
  /** Computed ECL in LCY */
  ecl: number;
  /** ECL coverage ratio = ECL / carrying */
  coverageRatio: number;
}

export interface StageSummary {
  stage: Stage | "TOTAL";
  exposure: number;
  impairment: number;
  coverageRatio: number;
  count: number;
}

export interface SpecificationSummary {
  specification: AssetSpecification | "TOTAL";
  exposure: number;
  impairment: number;
  coverageRatio: number;
  count: number;
}

export interface EngineResult {
  rows: SecurityComputed[];
  byStage: StageSummary[];
  bySpecification: SpecificationSummary[];
  totals: {
    exposureLcy: number;
    impairmentLcy: number;
    coverageRatio: number;
    instrumentCount: number;
  };
}
