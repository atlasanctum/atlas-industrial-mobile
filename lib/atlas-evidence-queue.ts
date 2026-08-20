import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import * as FileSystem from "expo-file-system/legacy";

import type { AtlasEvidenceDraft, AtlasEventInput } from "@/shared/atlas-domain";

const evidenceKey = "atlas.evidence-queue.v1";
const evidenceDirectory = `${FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? ""}atlas-evidence/`;

export type EvidenceInput = {
  eventClientId: string;
  localUri: string;
  contentType: string;
  filename: string;
  entityType: AtlasEventInput["entityType"];
  entityId: string;
};

export async function readEvidenceQueue(): Promise<AtlasEvidenceDraft[]> {
  const raw = await AsyncStorage.getItem(evidenceKey);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as AtlasEvidenceDraft[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeEvidenceQueue(items: AtlasEvidenceDraft[]) {
  await AsyncStorage.setItem(evidenceKey, JSON.stringify(items));
}

function extensionFor(contentType: string, fallbackName: string) {
  const existing = fallbackName.split(".").pop();
  if (existing && existing !== fallbackName) return `.${existing}`;
  if (contentType.includes("jpeg")) return ".jpg";
  if (contentType.includes("png")) return ".png";
  if (contentType.includes("m4a")) return ".m4a";
  if (contentType.includes("webm")) return ".webm";
  return ".bin";
}

export async function queueEvidenceFile(input: EvidenceInput) {
  const sourceInfo = await FileSystem.getInfoAsync(input.localUri);
  if (!sourceInfo.exists || typeof sourceInfo.size !== "number" || sourceInfo.size <= 0) throw new Error("Evidence file is unavailable on this device.");
  if (sourceInfo.size > 16 * 1024 * 1024) throw new Error("Evidence exceeds the 16 MB upload limit.");
  await FileSystem.makeDirectoryAsync(evidenceDirectory, { intermediates: true });
  const id = Crypto.randomUUID();
  const destination = `${evidenceDirectory}${id}${extensionFor(input.contentType, input.filename)}`;
  await FileSystem.copyAsync({ from: input.localUri, to: destination });
  const draft: AtlasEvidenceDraft = { id, eventClientId: input.eventClientId, localUri: destination, contentType: input.contentType, filename: input.filename, sizeBytes: sourceInfo.size, entityType: input.entityType, entityId: input.entityId, createdAt: new Date().toISOString(), status: "pending_upload", attempts: 0 };
  const queue = await readEvidenceQueue();
  await writeEvidenceQueue([...queue, draft]);
  return draft;
}

export async function markEvidenceUploaded(id: string, remoteUrl: string) {
  const queue = await readEvidenceQueue();
  const next = queue.map((item) => item.id === id ? { ...item, status: "uploaded" as const, remoteUrl } : item);
  await writeEvidenceQueue(next);
  return next;
}

export async function removeUploadedEvidence(id: string) {
  const queue = await readEvidenceQueue();
  const item = queue.find((candidate) => candidate.id === id);
  if (item) await FileSystem.deleteAsync(item.localUri, { idempotent: true }).catch(() => undefined);
  const next = queue.filter((candidate) => candidate.id !== id);
  await writeEvidenceQueue(next);
  return next;
}

export async function recordEvidenceAttempt(id: string) {
  const queue = await readEvidenceQueue();
  const next = queue.map((item) => item.id === id ? { ...item, attempts: item.attempts + 1, status: "failed" as const } : item);
  await writeEvidenceQueue(next);
  return next;
}
