"use client";

import { useSyncExternalStore } from "react";

const CURRENT_USER_ID_KEY = "fitagent.currentUserId";
const CURRENT_USER_ID_EVENT = "fitagent.currentUserIdChanged";

export function getCurrentUserId(): number | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(CURRENT_USER_ID_KEY);
  if (!raw) return null;

  const userId = Number(raw);
  return Number.isInteger(userId) && userId > 0 ? userId : null;
}

export function setCurrentUserId(userId: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CURRENT_USER_ID_KEY, String(userId));
  window.dispatchEvent(new Event(CURRENT_USER_ID_EVENT));
}

export function clearCurrentUserId() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CURRENT_USER_ID_KEY);
  window.dispatchEvent(new Event(CURRENT_USER_ID_EVENT));
}

function subscribeCurrentUserId(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CURRENT_USER_ID_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CURRENT_USER_ID_EVENT, onStoreChange);
  };
}

function getServerCurrentUserId() {
  return null;
}

export function useCurrentUserId() {
  return useSyncExternalStore(
    subscribeCurrentUserId,
    getCurrentUserId,
    getServerCurrentUserId,
  );
}
