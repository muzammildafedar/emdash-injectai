import { apiFetch, parseApiResponse } from "emdash/plugin-utils";

export const API = "/_emdash/api/plugins/injectai";

export async function apiGet<T>(route: string): Promise<T> {
  const res = await apiFetch(`${API}/${route}`);
  return parseApiResponse<T>(res, `Failed to load ${route}`);
}

export async function apiPost<T = { ok: boolean }>(route: string, body?: unknown): Promise<T> {
  const res = await apiFetch(`${API}/${route}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  return parseApiResponse<T>(res, `Failed to call ${route}`);
}
