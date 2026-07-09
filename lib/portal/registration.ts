import type { RegistrationDraft } from "../../types/portal";

const STORAGE_KEY = "ishaker_portal_registration";

const isBrowser = () => typeof window !== "undefined";

export const loadRegistrationDraft = (): RegistrationDraft | null => {
  if (!isBrowser()) return null;

  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as RegistrationDraft;
  } catch {
    return null;
  }
};

export const saveRegistrationDraft = (draft: RegistrationDraft) => {
  if (!isBrowser()) return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
};

export const mergeRegistrationDraft = (partial: RegistrationDraft) => {
  const current = loadRegistrationDraft() || {};
  const next = { ...current, ...partial };
  saveRegistrationDraft(next);
  return next;
};

export const clearRegistrationDraft = () => {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(STORAGE_KEY);
};
