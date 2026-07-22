import type { ApiError, Session, User } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

async function request<T>(path: string, init: RequestInit = {}): Promise<{ data: T | null; error: ApiError | null }> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      ...init,
      headers: { "content-type": "application/json", ...init.headers },
    });
    const body = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) {
      return { data: null, error: { message: body?.message ?? body?.error ?? `Request failed (${response.status})`, status: response.status } };
    }
    return { data: body as T, error: null };
  } catch (error) {
    return { data: null, error: { message: error instanceof Error ? error.message : "Network request failed" } };
  }
}

type Filter = { column: string; operator: string; value: unknown };

class Query<T = unknown> implements PromiseLike<{ data: T | null; error: ApiError | null }> {
  private action = "select";
  private payload: unknown;
  private filters: Filter[] = [];
  private query = new URLSearchParams();
  private one = false;

  constructor(private table: string) {}
  select(columns = "*") { this.query.set("select", columns); return this; }
  insert(value: unknown) { this.action = "insert"; this.payload = value; return this; }
  upsert(value: unknown) { this.action = "upsert"; this.payload = value; return this; }
  update(value: unknown) { this.action = "update"; this.payload = value; return this; }
  delete() { this.action = "delete"; return this; }
  eq(column: string, value: unknown) { this.filters.push({ column, operator: "eq", value }); return this; }
  neq(column: string, value: unknown) { this.filters.push({ column, operator: "neq", value }); return this; }
  order(column: string, options?: { ascending?: boolean }) { this.query.set("order", `${column}.${options?.ascending === false ? "desc" : "asc"}`); return this; }
  limit(value: number) { this.query.set("limit", String(value)); return this; }
  single() { this.one = true; return this; }
  maybeSingle() { this.one = true; return this; }
  async execute() {
    const method = this.action === "select" ? "GET" : this.action === "insert" || this.action === "upsert" ? "POST" : this.action === "update" ? "PATCH" : "DELETE";
    const result = await request<unknown>(`/data/${encodeURIComponent(this.table)}?${this.query}`, {
      method,
      body: method === "GET" ? undefined : JSON.stringify({ value: this.payload, filters: this.filters, upsert: this.action === "upsert" }),
      headers: this.filters.length && method === "GET" ? { "x-query-filters": JSON.stringify(this.filters) } : undefined,
    });
    if (this.one && Array.isArray(result.data)) result.data = result.data[0] ?? null;
    return result as { data: T | null; error: ApiError | null };
  }
  then<TResult1 = { data: T | null; error: ApiError | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: T | null; error: ApiError | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> { return this.execute().then(onfulfilled, onrejected); }
}

type AuthListener = (event: string, session: Session | null) => void;
const listeners = new Set<AuthListener>();
let currentSession: Session | null = null;

const auth = {
  onAuthStateChange(listener: AuthListener) {
    listeners.add(listener);
    return { data: { subscription: { unsubscribe: () => listeners.delete(listener) } } };
  },
  async getSession() {
    const result = await request<any>("/auth/session");
    currentSession = result.data?.authenticated ? { ...result.data, user: result.data.user } : null;
    return { data: { session: currentSession }, error: result.error };
  },
  async getProfile() { return request<any>("/auth/profile"); },
  async signUp(input: any) {
    const result = await request<any>("/auth/register", { method: "POST", body: JSON.stringify({ email: input.email, password: input.password, display_name: input.options?.data?.display_name, requested_role: input.options?.data?.requested_role }) });
    return { data: result.data, error: result.error };
  },
  async signInWithPassword(input: { email: string; password: string }) {
    const result = await request<any>("/auth/login", { method: "POST", body: JSON.stringify(input) });
    if (!result.error) {
      const sessionResult = await auth.getSession();
      currentSession = sessionResult.data.session
        ? { ...sessionResult.data.session, user: { ...sessionResult.data.session.user, ...(result.data?.user ?? {}) } }
        : null;
      listeners.forEach(listener => listener("SIGNED_IN", currentSession));
    }
    return { data: { ...(result.data ?? {}), session: currentSession }, error: result.error };
  },
  async signOut() {
    const result = await request<any>("/auth/logout", { method: "POST", body: "{}" });
    currentSession = null;
    listeners.forEach(listener => listener("SIGNED_OUT", null));
    return { error: result.error };
  },
  async resend(input: unknown) { const result = await request<any>("/auth/resend", { method: "POST", body: JSON.stringify(input) }); return result; },
  async updateUser(input: unknown) {
    const result = await request<any>("/auth/user", { method: "PATCH", body: JSON.stringify(input) });
    if (!result.error) {
      const sessionResult = await auth.getSession();
      currentSession = sessionResult.data.session;
      listeners.forEach(listener => listener("USER_UPDATED", currentSession));
    }
    return result;
  },
  async resetPasswordForEmail(email: string) { const result = await request<any>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }); return result; },
  mfa: {
    async listFactors() { const result = await request<any>("/auth/mfa/factors"); return { data: result.data ?? { totp: [] }, error: result.error }; },
    async enroll(input: any) { const result = await request<any>("/auth/mfa/setup", { method: "POST", body: JSON.stringify(input) }); return result; },
    async challengeAndVerify(input: any) {
      const result = await request<any>("/auth/mfa/verify", { method: "POST", body: JSON.stringify({ factor_id: input.factorId, code: input.code }) });
      if (!result.error) {
        const sessionResult = await auth.getSession();
        currentSession = sessionResult.data.session;
        listeners.forEach(listener => listener("MFA_VERIFIED", currentSession));
      }
      return result;
    },
    async requestOtp() { return request<any>("/auth/mfa/otp/request", { method: "POST", body: "{}" }); },
    async verifyOtp(code: string) {
      const result = await request<any>("/auth/mfa/otp/verify", { method: "POST", body: JSON.stringify({ code }) });
      if (!result.error) {
        const sessionResult = await auth.getSession();
        currentSession = sessionResult.data.session;
        listeners.forEach(listener => listener("MFA_VERIFIED", currentSession));
      }
      return result;
    },
    async unenroll(input: any) { const result = await request<any>("/auth/mfa/unenroll", { method: "POST", body: JSON.stringify({ factor_id: input.factorId }) }); return result; },
  },
};

export const api = {
  auth,
  from<T = unknown>(table: string) { return new Query<T>(table); },
  async rpc<T = unknown>(name: string, body: unknown) { return request<T>(`/rpc/${encodeURIComponent(name)}`, { method: "POST", body: JSON.stringify(body) }); },
  functions: { async invoke<T = unknown>(name: string, options?: { body?: unknown }) { return request<T>(`/fn/${encodeURIComponent(name)}`, { method: "POST", body: JSON.stringify(options?.body ?? {}) }); } },
  aria: {
    async speak(text: string): Promise<{ data: Blob | null; error: ApiError | null }> {
      try {
        const response = await fetch(`${API_BASE}/fn/dr-aria-speech`, {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          return { data: null, error: { message: body?.message ?? body?.error ?? `Voice request failed (${response.status})`, status: response.status } };
        }
        return { data: await response.blob(), error: null };
      } catch (error) {
        return { data: null, error: { message: error instanceof Error ? error.message : "Voice request failed" } };
      }
    },
  },
  storage: { from(bucket: string) { return { async upload(path: string, file: File) { const form = new FormData(); form.append("file", file); const response = await fetch(`${API_BASE}/storage/${encodeURIComponent(bucket)}/${path}`, { method: "PUT", credentials: "include", body: form }); return response.ok ? { data: { path }, error: null } : { data: null, error: { message: `Upload failed (${response.status})`, status: response.status } }; } }; } },
};

export type { ApiError, Session, User };
