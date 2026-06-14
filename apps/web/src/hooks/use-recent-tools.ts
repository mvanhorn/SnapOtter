import { useSyncExternalStore } from "react";

const STORAGE_KEY = "snapotter-recent-tools";
const MAX_RECENT = 5;

let listeners: Array<() => void> = [];

function getSnapshot(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function recordRecentTool(toolId: string) {
  const current = getSnapshot();
  const updated = [toolId, ...current.filter((id) => id !== toolId)].slice(0, MAX_RECENT);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  listeners.forEach((l) => l());
}

export function useRecentTools(): string[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => []);
}
