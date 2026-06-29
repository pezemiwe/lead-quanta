import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { canDo } from "../../context/platform-personas";
import type {
  AssetClass,
  AuditEvent,
  DealSlip,
  DealSlipStatus,
  RegisterPosition,
  ReviewFunction,
  SettlementStatus,
  WorkflowComment,
  WorkflowException,
} from "./types";
import {
  dealNotional,
  dealSlipLabel,
  emptyFieldsForAssetClass,
  validateMandatoryFields,
} from "./engine/fields";
import { runAutomatedChecks, allChecksCleared } from "./engine/checks";
import { isEditableStatus } from "./engine/transitions";
import {
  isNewerSnapshot,
  loadWorkflowSnapshot,
  saveWorkflowSnapshot,
  SYNC_CHANNEL,
} from "./sync";

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function now(): string {
  return new Date().toISOString();
}

function audit(
  user: string,
  role: string,
  action: string,
  extra?: Partial<AuditEvent>,
): AuditEvent {
  return {
    id: uid("aud"),
    at: now(),
    user,
    role,
    action,
    ...extra,
  };
}

const SEED_DEALS: DealSlip[] = [
  {
    id: "DS-2026-0042",
    assetClass: "Fixed deposits and call deposits",
    portfolioId: "pb-banking",
    portfolioName: "Banking Book",
    status: "Under Review",
    fields: {
      counterparty: "Zenith Bank Plc",
      principal: "2500000000",
      rate: "18.5",
      tenor: "90 days",
      tradeDate: "2026-05-28",
      valueDate: "2026-05-30",
      maturityDate: "2026-08-28",
      dayCount: "ACT/365",
      expectedInterest: "11575342",
      settlementAccount: "0123456789 / Zenith Ops",
      rolloverInstruction: "Manual review",
    },
    createdBy: "Amina Yusuf",
    createdByRole: "Money Market Trader",
    createdAt: "2026-05-27T09:15:00Z",
    updatedAt: "2026-05-28T11:00:00Z",
    submittedAt: "2026-05-28T10:30:00Z",
    documents: [
      {
        id: "doc-1",
        name: "Zenith-term-sheet.pdf",
        uploadedAt: "2026-05-28T10:20:00Z",
        uploadedBy: "Amina Yusuf",
      },
    ],
    checks: [],
    comments: [
      {
        id: "c1",
        at: "2026-05-28T11:00:00Z",
        user: "Kemi Adebayo",
        role: "Middle Office",
        function: "Middle Office",
        text: "Pricing within market range. Awaiting compliance clearance.",
        type: "comment",
      },
    ],
    auditTrail: [],
    version: 1,
  },
  {
    id: "DS-2026-0041",
    assetClass: "Bonds",
    portfolioId: "pb-trading",
    portfolioName: "Trading Book",
    status: "Approved",
    fields: {
      issuer: "FGN",
      isin: "NGFGN2030A",
      coupon: "15.0",
      couponFrequency: "Semi-Annual",
      cleanPrice: "98.50",
      accruedInterest: "1.25",
      dirtyPrice: "99.75",
      yield: "15.8",
      settlementValue: "997500000",
      maturityDate: "2030-03-15",
      duration: "4.2",
      dv01: "4200000",
    },
    createdBy: "Tunde Bakare",
    createdByRole: "Fixed Income Trader",
    createdAt: "2026-05-26T14:00:00Z",
    updatedAt: "2026-05-27T16:00:00Z",
    submittedAt: "2026-05-26T15:00:00Z",
    approvedAt: "2026-05-27T16:00:00Z",
    approvedBy: "Ngozi Eze",
    documents: [{ id: "doc-2", name: "broker-confirmation.pdf", uploadedAt: "2026-05-26T14:30:00Z", uploadedBy: "Tunde Bakare" }],
    checks: [],
    comments: [],
    auditTrail: [],
    version: 1,
  },
  {
    id: "DS-2026-0038",
    assetClass: "Equities",
    portfolioId: "pb-trading",
    portfolioName: "Trading Book",
    status: "Pending Settlement",
    fields: {
      issuer: "Dangote Cement Plc",
      ticker: "DANGCEM",
      broker: "Stanbic IBTC",
      quantity: "500000",
      price: "285.50",
      fees: "125000",
      tradeDate: "2026-05-25",
      settlementDate: "2026-05-27",
      settlementValue: "142875000",
      cscsOrCustodian: "CSCS / First Bank Custody",
    },
    createdBy: "Chioma Okonkwo",
    createdByRole: "Equity Trader",
    createdAt: "2026-05-25T11:00:00Z",
    updatedAt: "2026-05-28T09:00:00Z",
    submittedAt: "2026-05-25T12:00:00Z",
    approvedAt: "2026-05-26T10:00:00Z",
    approvedBy: "Ngozi Eze",
    documents: [{ id: "doc-3", name: "broker-note.pdf", uploadedAt: "2026-05-25T11:30:00Z", uploadedBy: "Chioma Okonkwo" }],
    checks: [],
    comments: [],
    settlement: {
      id: "SI-0038",
      beneficiary: "Stanbic IBTC Securities",
      account: "0129988776",
      custodian: "First Bank Custody",
      broker: "Stanbic IBTC",
      valueDate: "2026-05-27",
      currency: "NGN",
      amount: "142875000",
      createdBy: "Ibrahim Musa",
      createdAt: "2026-05-27T08:00:00Z",
      checkedBy: "Fatima Bello",
      checkedAt: "2026-05-27T09:00:00Z",
      status: "checked",
    },
    settlementStatus: "Instruction Checked",
    auditTrail: [],
    version: 1,
  },
];

// Populate checks for seed deals
for (const d of SEED_DEALS) {
  if (d.status !== "Draft") d.checks = runAutomatedChecks(d);
}

const SEED_REGISTER: RegisterPosition[] = [
  {
    id: "REG-2026-0001",
    dealSlipId: "DS-2026-0030",
    assetClass: "Treasury bills and commercial papers",
    portfolioId: "pb-banking",
    label: "FGN T-Bill May 2026",
    counterparty: "Central Bank of Nigeria",
    currency: "NGN",
    notional: 1_500_000_000,
    status: "Active",
    settledAt: "2026-05-20T14:00:00Z",
    fields: { issuer: "FGN", faceValue: "1500000000" },
  },
];

interface WorkflowContextValue {
  dealSlips: DealSlip[];
  register: RegisterPosition[];
  exceptions: WorkflowException[];
  getDealSlip: (id: string) => DealSlip | undefined;
  createDealSlip: (input: {
    assetClass: AssetClass;
    portfolioId: string;
    portfolioName: string;
    fields: Record<string, string>;
    user: string;
    role: string;
    documents?: { name: string }[];
  }) => { ok: true; id: string } | { ok: false; error: string };
  updateDealSlip: (
    id: string,
    fields: Record<string, string>,
    user: string,
    role: string,
  ) => { ok: boolean; error?: string };
  saveDraft: (id: string, user: string, role: string) => void;
  submitDealSlip: (id: string, user: string, role: string) => { ok: boolean; error?: string };
  startReview: (id: string, user: string, role: string) => { ok: boolean; error?: string };
  addComment: (
    id: string,
    user: string,
    role: string,
    text: string,
    type: WorkflowComment["type"],
    fn?: ReviewFunction,
  ) => void;
  clearCheck: (
    id: string,
    checkId: string,
    user: string,
    role: string,
    fn: ReviewFunction,
  ) => { ok: boolean; error?: string };
  returnForAmendment: (id: string, user: string, role: string, reason: string) => void;
  rejectDealSlip: (id: string, user: string, role: string, reason: string) => void;
  approveDealSlip: (id: string, user: string, role: string, reason?: string) => { ok: boolean; error?: string };
  generateSettlementInstruction: (
    id: string,
    user: string,
    role: string,
    instruction: Omit<NonNullable<DealSlip["settlement"]>, "id" | "createdAt" | "createdBy" | "status">,
  ) => { ok: boolean; error?: string };
  checkSettlementInstruction: (id: string, user: string, role: string) => { ok: boolean; error?: string };
  confirmSettlement: (
    id: string,
    user: string,
    role: string,
    outcome: SettlementStatus,
    reason?: string,
  ) => { ok: boolean; error?: string };
  createException: (
    dealSlipId: string,
    type: string,
    description: string,
    owner: string,
    dueDate: string,
  ) => void;
  closeException: (id: string, comment: string) => void;
  duplicateDealSlip: (
    id: string,
    user: string,
    role: string,
  ) => { ok: true; id: string } | { ok: false; error: string };
  syncVersion: number;
  lastSyncedAt: string | null;
  queues: {
    myDeals: (role: string, user: string) => DealSlip[];
    reviewQueue: (role: string) => DealSlip[];
    approvalQueue: (role: string) => DealSlip[];
    settlementQueue: (role: string) => DealSlip[];
    exceptions: () => WorkflowException[];
  };
}

const WorkflowContext = createContext<WorkflowContextValue | null>(null);

function patchDeal(deals: DealSlip[], id: string, patch: Partial<DealSlip>): DealSlip[] {
  return deals.map((d) => (d.id === id ? { ...d, ...patch, updatedAt: now() } : d));
}

function appendAudit(deal: DealSlip, event: AuditEvent): DealSlip {
  return { ...deal, auditTrail: [event, ...deal.auditTrail] };
}

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const persisted = loadWorkflowSnapshot();
  const [dealSlips, setDealSlips] = useState<DealSlip[]>(
    persisted?.dealSlips ?? SEED_DEALS,
  );
  const [register, setRegister] = useState<RegisterPosition[]>(
    persisted?.register ?? SEED_REGISTER,
  );
  const [exceptions, setExceptions] = useState<WorkflowException[]>(
    persisted?.exceptions ?? [
      {
        id: "EX-001",
        dealSlipId: "DS-2026-0038",
        type: "Document mismatch",
        description: "Broker note amount differs from deal slip by ₦125,000 (fees treatment)",
        owner: "Middle Office",
        dueDate: "2026-05-30",
        status: "assigned",
        createdAt: "2026-05-28T09:30:00Z",
      },
    ],
  );
  const [syncVersion, setSyncVersion] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(
    persisted?.updatedAt ?? null,
  );
  const lastSavedAt = useRef<string | null>(persisted?.updatedAt ?? null);
  const skipNextSave = useRef(false);

  const applySnapshot = useCallback(
    (snapshot: NonNullable<ReturnType<typeof loadWorkflowSnapshot>>) => {
      if (lastSavedAt.current && !isNewerSnapshot(snapshot.updatedAt, lastSavedAt.current)) {
        return;
      }
      skipNextSave.current = true;
      setDealSlips(snapshot.dealSlips);
      setRegister(snapshot.register);
      setExceptions(snapshot.exceptions);
      lastSavedAt.current = snapshot.updatedAt;
      setLastSyncedAt(snapshot.updatedAt);
      setSyncVersion((v) => v + 1);
    },
    [],
  );

  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    const updatedAt = saveWorkflowSnapshot({ dealSlips, register, exceptions });
    lastSavedAt.current = updatedAt;
    setLastSyncedAt(updatedAt);
  }, [dealSlips, register, exceptions]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== "lead-quanta-workflow-v1") return;
      const snapshot = loadWorkflowSnapshot();
      if (snapshot) applySnapshot(snapshot);
    };
    window.addEventListener("storage", onStorage);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(SYNC_CHANNEL);
      channel.onmessage = () => {
        const snapshot = loadWorkflowSnapshot();
        if (snapshot) applySnapshot(snapshot);
      };
    } catch {
      /* ignore */
    }

    const interval = window.setInterval(() => {
      const snapshot = loadWorkflowSnapshot();
      if (snapshot && isNewerSnapshot(snapshot.updatedAt, lastSavedAt.current ?? "")) {
        applySnapshot(snapshot);
      }
    }, 15000);

    return () => {
      window.removeEventListener("storage", onStorage);
      channel?.close();
      window.clearInterval(interval);
    };
  }, [applySnapshot]);

  const getDealSlip = useCallback(
    (id: string) => dealSlips.find((d) => d.id === id),
    [dealSlips],
  );

  const createDealSlip = useCallback(
    (input: {
      assetClass: AssetClass;
      portfolioId: string;
      portfolioName: string;
      fields: Record<string, string>;
      user: string;
      role: string;
      documents?: { name: string }[];
    }) => {
      if (!canDo(input.role, "dealSlip", "C")) {
        return { ok: false as const, error: "Your role cannot create deal slips." };
      }
      let createdId = "";
      setDealSlips((prev) => {
        createdId = `DS-2026-${String(prev.length + 43).padStart(4, "0")}`;
        const docs = (input.documents ?? []).map((d) => ({
          id: uid("doc"),
          name: d.name,
          uploadedAt: now(),
          uploadedBy: input.user,
        }));
        const deal: DealSlip = {
          id: createdId,
          assetClass: input.assetClass,
          portfolioId: input.portfolioId,
          portfolioName: input.portfolioName,
          status: "Draft",
          fields: { ...emptyFieldsForAssetClass(input.assetClass), ...input.fields },
          createdBy: input.user,
          createdByRole: input.role,
          createdAt: now(),
          updatedAt: now(),
          documents: docs,
          checks: [],
          comments: [],
          auditTrail: [
            audit(input.user, input.role, "Deal slip created", {
              newValue: dealSlipLabel(input.fields, input.assetClass),
            }),
          ],
          version: 1,
        };
        return [deal, ...prev];
      });
      return { ok: true as const, id: createdId };
    },
    [],
  );

  const updateDealSlip = useCallback(
    (id: string, fields: Record<string, string>, user: string, role: string) => {
      const deal = dealSlips.find((d) => d.id === id);
      if (!deal) return { ok: false, error: "Deal slip not found." };
      if (!isEditableStatus(deal.status)) {
        return { ok: false, error: "Deal slip is locked in current status." };
      }
      if (!canDo(role, "dealSlip", "C") && deal.createdByRole !== role) {
        return { ok: false, error: "You cannot edit this deal slip." };
      }
      setDealSlips((prev) =>
        patchDeal(prev, id, {
          fields: { ...deal.fields, ...fields },
          auditTrail: [
            audit(user, role, "Deal slip amended", { field: "fields" }),
            ...deal.auditTrail,
          ],
        }),
      );
      return { ok: true };
    },
    [dealSlips],
  );

  const saveDraft = useCallback((id: string, user: string, role: string) => {
    setDealSlips((prev) => {
      const deal = prev.find((d) => d.id === id);
      if (!deal) return prev;
      return patchDeal(prev, id, {
        auditTrail: [audit(user, role, "Draft saved"), ...deal.auditTrail],
      });
    });
  }, []);

  const submitDealSlip = useCallback((id: string, user: string, role: string) => {
    let result: { ok: boolean; error?: string } = {
      ok: false,
      error: "Deal slip not found.",
    };
    setDealSlips((prev) => {
      const deal = prev.find((d) => d.id === id);
      if (!deal) return prev;
      if (!canDo(role, "dealSlip", "C")) {
        result = { ok: false, error: "Your role cannot submit deal slips." };
        return prev;
      }
      if (!isEditableStatus(deal.status)) {
        result = { ok: false, error: "Only draft or returned deals can be submitted." };
        return prev;
      }
      const missing = validateMandatoryFields(deal.assetClass, deal.fields);
      if (missing.length) {
        result = { ok: false, error: `Missing mandatory fields: ${missing.join(", ")}` };
        return prev;
      }
      const checks = runAutomatedChecks(deal);
      result = { ok: true };
      return patchDeal(prev, id, {
        status: "Submitted",
        submittedAt: now(),
        checks,
        auditTrail: [
          audit(user, role, "Submitted for review", {
            oldValue: deal.status,
            newValue: "Submitted",
          }),
          ...deal.auditTrail,
        ],
      });
    });
    return result;
  }, []);

  const startReview = useCallback(
    (id: string, user: string, role: string) => {
      if (!canDo(role, "checks", "R") && !canDo(role, "dealSlip", "R")) {
        return { ok: false, error: "Your role cannot review deal slips." };
      }
      const deal = dealSlips.find((d) => d.id === id);
      if (!deal) return { ok: false, error: "Deal slip not found." };
      if (deal.status !== "Submitted" && deal.status !== "Under Review") {
        return { ok: false, error: "Deal slip is not in reviewable status." };
      }
      setDealSlips((prev) =>
        patchDeal(prev, id, {
          status: "Under Review",
          auditTrail: [
            audit(user, role, "Review started", { newValue: "Under Review" }),
            ...deal.auditTrail,
          ],
        }),
      );
      return { ok: true };
    },
    [dealSlips],
  );

  const addComment = useCallback(
    (
      id: string,
      user: string,
      role: string,
      text: string,
      type: WorkflowComment["type"],
      fn?: ReviewFunction,
    ) => {
      const comment: WorkflowComment = {
        id: uid("cmt"),
        at: now(),
        user,
        role,
        function: fn,
        text,
        type,
      };
      setDealSlips((prev) => {
        const deal = prev.find((d) => d.id === id);
        if (!deal) return prev;
        return patchDeal(prev, id, {
          comments: [...deal.comments, comment],
          auditTrail: [audit(user, role, `Comment: ${type}`, { reason: text }), ...deal.auditTrail],
        });
      });
    },
    [],
  );

  const clearCheck = useCallback(
    (id: string, checkId: string, user: string, role: string, fn: ReviewFunction) => {
      if (!canDo(role, "checks", "R")) {
        return { ok: false, error: "Your role cannot clear checks." };
      }
      setDealSlips((prev) => {
        const deal = prev.find((d) => d.id === id);
        if (!deal) return prev;
        const checks = deal.checks.map((c) =>
          c.id === checkId
            ? { ...c, status: "cleared" as const, reviewer: user, reviewedAt: now() }
            : c,
        );
        return patchDeal(prev, id, {
          checks,
          comments: [
            ...deal.comments,
            {
              id: uid("cmt"),
              at: now(),
              user,
              role,
              function: fn,
              text: `Cleared check: ${deal.checks.find((c) => c.id === checkId)?.label}`,
              type: "clearance",
            },
          ],
          auditTrail: [
            audit(user, role, "Check cleared", { field: checkId }),
            ...deal.auditTrail,
          ],
        });
      });
      return { ok: true };
    },
    [],
  );

  const returnForAmendment = useCallback(
    (id: string, user: string, role: string, reason: string) => {
      setDealSlips((prev) => {
        const deal = prev.find((d) => d.id === id);
        if (!deal) return prev;
        return patchDeal(prev, id, {
          status: "Returned for Amendment",
          version: deal.version + 1,
          comments: [
            ...deal.comments,
            {
              id: uid("cmt"),
              at: now(),
              user,
              role,
              text: reason,
              type: "return",
            },
          ],
          auditTrail: [
            audit(user, role, "Returned for amendment", {
              oldValue: deal.status,
              newValue: "Returned for Amendment",
              reason,
            }),
            ...deal.auditTrail,
          ],
        });
      });
    },
    [],
  );

  const rejectDealSlip = useCallback(
    (id: string, user: string, role: string, reason: string) => {
      setDealSlips((prev) => {
        const deal = prev.find((d) => d.id === id);
        if (!deal) return prev;
        return patchDeal(prev, id, {
          status: "Rejected",
          comments: [
            ...deal.comments,
            { id: uid("cmt"), at: now(), user, role, text: reason, type: "reject" },
          ],
          auditTrail: [
            audit(user, role, "Rejected", { reason, newValue: "Rejected" }),
            ...deal.auditTrail,
          ],
        });
      });
    },
    [],
  );

  const approveDealSlip = useCallback(
    (id: string, user: string, role: string, reason?: string) => {
      if (!canDo(role, "approval", "A")) {
        return { ok: false, error: "Your role cannot approve deals." };
      }
      const deal = dealSlips.find((d) => d.id === id);
      if (!deal) return { ok: false, error: "Deal slip not found." };
      if (deal.status !== "Under Review") {
        return { ok: false, error: "Deal must be under review before approval." };
      }
      if (!allChecksCleared(deal.checks)) {
        return { ok: false, error: "All control checks must be cleared or passed before approval." };
      }
      setDealSlips((prev) =>
        patchDeal(prev, id, {
          status: "Approved",
          approvedAt: now(),
          approvedBy: user,
          comments: [
            ...deal.comments,
            {
              id: uid("cmt"),
              at: now(),
              user,
              role,
              function: "Approval",
              text: reason ?? "Approved within mandate",
              type: "approve",
            },
          ],
          auditTrail: [
            audit(user, role, "Approved", {
              oldValue: deal.status,
              newValue: "Approved",
              reason,
            }),
            ...deal.auditTrail,
          ],
        }),
      );
      return { ok: true };
    },
    [dealSlips],
  );

  const generateSettlementInstruction = useCallback(
    (
      id: string,
      user: string,
      role: string,
      instruction: Omit<
        NonNullable<DealSlip["settlement"]>,
        "id" | "createdAt" | "createdBy" | "status"
      >,
    ) => {
      if (!canDo(role, "settle", "S")) {
        return { ok: false, error: "Your role cannot raise settlement instructions." };
      }
      const deal = dealSlips.find((d) => d.id === id);
      if (!deal) return { ok: false, error: "Deal slip not found." };
      if (deal.status !== "Approved" && deal.status !== "Pending Settlement") {
        return { ok: false, error: "Deal must be approved before settlement." };
      }
      const settlement = {
        id: uid("SI"),
        ...instruction,
        createdBy: user,
        createdAt: now(),
        status: "draft" as const,
      };
      setDealSlips((prev) =>
        patchDeal(prev, id, {
          status: "Pending Settlement",
          settlement,
          settlementStatus: "Instruction Generated",
          auditTrail: [
            audit(user, role, "Settlement instruction generated"),
            ...deal.auditTrail,
          ],
        }),
      );
      return { ok: true };
    },
    [dealSlips],
  );

  const checkSettlementInstruction = useCallback(
    (id: string, user: string, role: string) => {
      if (!canDo(role, "settle", "S")) {
        return { ok: false, error: "Your role cannot check settlement instructions." };
      }
      const deal = dealSlips.find((d) => d.id === id);
      if (!deal?.settlement) return { ok: false, error: "No settlement instruction to check." };
      if (deal.settlement.createdBy === user) {
        return { ok: false, error: "Maker-checker: checker must differ from maker." };
      }
      setDealSlips((prev) =>
        patchDeal(prev, id, {
          settlement: {
            ...deal.settlement!,
            checkedBy: user,
            checkedAt: now(),
            status: "checked",
          },
          settlementStatus: "Instruction Checked",
          auditTrail: [
            audit(user, role, "Settlement instruction checked (maker-checker)"),
            ...deal.auditTrail,
          ],
        }),
      );
      return { ok: true };
    },
    [dealSlips],
  );

  const confirmSettlement = useCallback(
    (
      id: string,
      user: string,
      role: string,
      outcome: SettlementStatus,
      reason?: string,
    ) => {
      if (!canDo(role, "settle", "S")) {
        return { ok: false, error: "Your role cannot confirm settlement." };
      }
      const deal = dealSlips.find((d) => d.id === id);
      if (!deal) return { ok: false, error: "Deal slip not found." };
      if (!deal.settlement || deal.settlement.status !== "checked") {
        return { ok: false, error: "Settlement instruction must be checked before confirmation." };
      }

      if (outcome === "Failed" || outcome === "Reversed") {
        setDealSlips((prev) =>
          patchDeal(prev, id, {
            settlementStatus: outcome,
            status: "Rejected",
            auditTrail: [
              audit(user, role, `Settlement ${outcome}`, { reason }),
              ...deal.auditTrail,
            ],
          }),
        );
        setExceptions((prev) => [
          {
            id: uid("EX"),
            dealSlipId: id,
            type: "Failed settlement",
            description: reason ?? `Settlement marked ${outcome}`,
            owner: "Back Office",
            dueDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
            status: "open",
            createdAt: now(),
          },
          ...prev,
        ]);
        return { ok: true };
      }

      const isPartial = outcome === "Partially Settled";
      const regId = uid("REG");
      const position: RegisterPosition = {
        id: regId,
        dealSlipId: id,
        assetClass: deal.assetClass,
        portfolioId: deal.portfolioId,
        label: dealSlipLabel(deal.fields, deal.assetClass),
        counterparty:
          deal.fields.counterparty || deal.fields.issuer || deal.fields.broker || "—",
        currency: deal.settlement.currency,
        notional: isPartial ? dealNotional(deal.fields) * 0.5 : dealNotional(deal.fields),
        status: "Active",
        settledAt: now(),
        fields: deal.fields,
      };

      setRegister((prev) => [position, ...prev]);
      setDealSlips((prev) =>
        patchDeal(prev, id, {
          status: "Active",
          settlementStatus: outcome,
          settledAt: now(),
          registerPositionId: regId,
          auditTrail: [
            audit(user, role, "Settlement confirmed — register activated", {
              newValue: outcome,
              reason,
            }),
            ...deal.auditTrail,
          ],
        }),
      );

      if (isPartial || outcome === "Settled with Exception") {
        setExceptions((prev) => [
          {
            id: uid("EX"),
            dealSlipId: id,
            type: isPartial ? "Partial settlement" : "Settlement exception",
            description: reason ?? "Remaining balance or exception requires follow-up",
            owner: "Middle Office",
            dueDate: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10),
            status: "open",
            createdAt: now(),
          },
          ...prev,
        ]);
      }

      return { ok: true };
    },
    [dealSlips],
  );

  const createException = useCallback(
    (dealSlipId: string, type: string, description: string, owner: string, dueDate: string) => {
      setExceptions((prev) => [
        {
          id: uid("EX"),
          dealSlipId,
          type,
          description,
          owner,
          dueDate,
          status: "open",
          createdAt: now(),
        },
        ...prev,
      ]);
    },
    [],
  );

  const closeException = useCallback((id: string, comment: string) => {
    setExceptions((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, status: "closed", closureComment: comment } : e,
      ),
    );
  }, []);

  const duplicateDealSlip = useCallback(
    (id: string, user: string, role: string) => {
      if (!canDo(role, "dealSlip", "C")) {
        return { ok: false as const, error: "Your role cannot create deal slips." };
      }
      const source = dealSlips.find((d) => d.id === id);
      if (!source) return { ok: false as const, error: "Deal slip not found." };
      return createDealSlip({
        assetClass: source.assetClass,
        portfolioId: source.portfolioId,
        portfolioName: source.portfolioName,
        fields: { ...source.fields },
        user,
        role,
        documents: source.documents.map((d) => ({ name: d.name })),
      });
    },
    [dealSlips, createDealSlip],
  );

  const queues = useMemo(
    () => ({
      myDeals: (role: string, user: string) =>
        dealSlips.filter(
          (d) =>
            d.createdByRole === role ||
            (canDo(role, "dealSlip", "C") && d.createdBy === user),
        ),
      reviewQueue: (role: string) => {
        if (!canDo(role, "checks", "R") && !canDo(role, "dealSlip", "R")) return [];
        return dealSlips.filter((d) =>
          ["Submitted", "Under Review"].includes(d.status),
        );
      },
      approvalQueue: (role: string) => {
        if (!canDo(role, "approval", "A")) return [];
        return dealSlips.filter((d) => d.status === "Under Review");
      },
      settlementQueue: (role: string) => {
        if (!canDo(role, "settle", "S")) return [];
        return dealSlips.filter((d) =>
          ["Approved", "Pending Settlement"].includes(d.status),
        );
      },
      exceptions: () => exceptions.filter((e) => e.status !== "closed"),
    }),
    [dealSlips, exceptions],
  );

  const value = useMemo(
    () => ({
      dealSlips,
      register,
      exceptions,
      getDealSlip,
      createDealSlip,
      updateDealSlip,
      saveDraft,
      submitDealSlip,
      startReview,
      addComment,
      clearCheck,
      returnForAmendment,
      rejectDealSlip,
      approveDealSlip,
      generateSettlementInstruction,
      checkSettlementInstruction,
      confirmSettlement,
      createException,
      closeException,
      duplicateDealSlip,
      syncVersion,
      lastSyncedAt,
      queues,
    }),
    [
      dealSlips,
      register,
      exceptions,
      getDealSlip,
      createDealSlip,
      updateDealSlip,
      saveDraft,
      submitDealSlip,
      startReview,
      addComment,
      clearCheck,
      returnForAmendment,
      rejectDealSlip,
      approveDealSlip,
      generateSettlementInstruction,
      checkSettlementInstruction,
      confirmSettlement,
      createException,
      closeException,
      duplicateDealSlip,
      syncVersion,
      lastSyncedAt,
      queues,
    ],
  );

  return (
    <WorkflowContext.Provider value={value}>{children}</WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const ctx = useContext(WorkflowContext);
  if (!ctx) throw new Error("useWorkflow must be used within WorkflowProvider");
  return ctx;
}
