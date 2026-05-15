const TOKEN_KEY = "insta_access_token";

export function apiV1Base(): string {
  const o = (import.meta.env.VITE_API_ORIGIN as string | undefined)?.trim();
  if (o) return `${o.replace(/\/$/, "")}/api/v1`;
  return "/api/v1";
}

export function getStoredToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const j: unknown = await res.json();
    if (j && typeof j === "object" && "detail" in j) {
      const d = (j as { detail: unknown }).detail;
      if (typeof d === "string") return d;
      if (Array.isArray(d))
        return d
          .map((x: unknown) =>
            typeof x === "object" && x !== null && "msg" in x ? String((x as { msg: unknown }).msg) : String(x),
          )
          .join(", ");
    }
  } catch {
    /* ignore */
  }
  return res.statusText || `HTTP ${res.status}`;
}

export type ApiFetchInit = Omit<RequestInit, "body"> & { json?: unknown; form?: FormData };

export async function apiFetch<T = unknown>(path: string, init: ApiFetchInit = {}): Promise<T> {
  const p = path.startsWith("/") ? path : `/${path}`;
  const url = `${apiV1Base()}${p}`;
  const { json, form, ...rest } = init;
  const headers = new Headers(rest.headers);
  const token = getStoredToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let body: BodyInit | undefined;
  if (form) {
    body = form;
    headers.delete("Content-Type");
  } else if (json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(json);
  }

  const res = await fetch(url, { ...rest, headers, body });
  if (!res.ok) throw new ApiError(res.status, await readErrorMessage(res));
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}
