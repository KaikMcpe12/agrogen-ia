import { get, set, del, keys } from "idb-keyval";
import type { QueryKey } from "@tanstack/react-query";

export interface QueuedMutation {
  id: string;
  timestamp: number;
  endpoint: string;
  method: "POST" | "PATCH" | "PUT";
  payload: unknown;
  invalidateKeys: QueryKey[];
  optimisticData?: unknown;
  retries: number;
  lastError?: string;
  status: "pending" | "syncing" | "failed";
}

const STORE_PREFIX = "queue:";
const MAX_QUEUE = 50;

export async function enqueue(
  mutation: Omit<QueuedMutation, "id" | "timestamp" | "retries" | "status">
): Promise<string> {
  const all = await listQueue();
  if (all.length >= MAX_QUEUE) {
    throw new Error(
      "Há muitas ações aguardando sincronização. Conecte-se à internet para enviar antes de adicionar mais."
    );
  }
  const item: QueuedMutation = {
    ...mutation,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    retries: 0,
    status: "pending",
  };
  await set(`${STORE_PREFIX}${item.id}`, item);
  return item.id;
}

export async function listQueue(): Promise<QueuedMutation[]> {
  const allKeys = await keys();
  const queueKeys = (allKeys as string[]).filter((k) => k.startsWith(STORE_PREFIX));
  const items = await Promise.all(queueKeys.map((k) => get<QueuedMutation>(k)));
  return (items.filter(Boolean) as QueuedMutation[]).sort((a, b) => a.timestamp - b.timestamp);
}

export async function removeFromQueue(id: string): Promise<void> {
  await del(`${STORE_PREFIX}${id}`);
}

export async function markFailed(id: string, error: string): Promise<void> {
  const item = await get<QueuedMutation>(`${STORE_PREFIX}${id}`);
  if (item) {
    item.retries += 1;
    item.lastError = error;
    item.status = "failed";
    await set(`${STORE_PREFIX}${id}`, item);
  }
}
