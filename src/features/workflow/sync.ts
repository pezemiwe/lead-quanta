import type { DealSlip, RegisterPosition, WorkflowException } from "./types";

const STORAGE_KEY = "lead-quanta-workflow-v1";
export const SYNC_CHANNEL = "lead-quanta-workflow-sync";

export interface WorkflowSnapshot {
  dealSlips: DealSlip[];
  register: RegisterPosition[];
  exceptions: WorkflowException[];
  updatedAt: string;
}

export function loadWorkflowSnapshot(): WorkflowSnapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WorkflowSnapshot;
    if (!parsed.dealSlips || !parsed.register) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveWorkflowSnapshot(
  data: Pick<WorkflowSnapshot, "dealSlips" | "register" | "exceptions">,
): string {
  const updatedAt = new Date().toISOString();
  const snapshot: WorkflowSnapshot = { ...data, updatedAt };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  try {
    const channel = new BroadcastChannel(SYNC_CHANNEL);
    channel.postMessage({ type: "sync", updatedAt });
    channel.close();
  } catch {
    /* BroadcastChannel unavailable */
  }
  return updatedAt;
}

export function isNewerSnapshot(a: string, b: string): boolean {
  return new Date(a).getTime() > new Date(b).getTime();
}
