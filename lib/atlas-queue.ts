import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

import type { AtlasEventInput } from "@/shared/atlas-domain";

const queueKey = "atlas.offline-event-queue.v1";

export type QueuedAtlasEvent = AtlasEventInput & {
  queuedAt: string;
  attempts: number;
};

export async function readQueuedAtlasEvents(): Promise<QueuedAtlasEvent[]> {
  const raw = await AsyncStorage.getItem(queueKey);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as QueuedAtlasEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeQueue(events: QueuedAtlasEvent[]) {
  await AsyncStorage.setItem(queueKey, JSON.stringify(events));
}

export async function enqueueAtlasEvent(input: Omit<AtlasEventInput, "clientEventId" | "occurredAt"> & Partial<Pick<AtlasEventInput, "clientEventId" | "occurredAt">>) {
  const event: QueuedAtlasEvent = {
    ...input,
    clientEventId: input.clientEventId ?? Crypto.randomUUID(),
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    queuedAt: new Date().toISOString(),
    attempts: 0,
  };
  const events = await readQueuedAtlasEvents();
  await writeQueue([...events, event]);
  return event;
}

export async function acknowledgeAtlasEvents(clientEventIds: string[]) {
  const acknowledged = new Set(clientEventIds);
  const events = await readQueuedAtlasEvents();
  const remaining = events.filter((event) => !acknowledged.has(event.clientEventId));
  await writeQueue(remaining);
  return remaining;
}

export async function recordSyncAttempt() {
  const events = await readQueuedAtlasEvents();
  const retried = events.map((event) => ({ ...event, attempts: event.attempts + 1 }));
  await writeQueue(retried);
  return retried;
}
