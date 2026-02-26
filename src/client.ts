import { PayApiError, PayValidationError } from "./errors.js";
import type {
  CreateIntentRequest,
  CreateIntentResponse,
  ErrorResponse,
  ExecuteIntentResponse,
  GetIntentResponse,
} from "./types.js";

const V2_PATH_PREFIX = "/v2";
const DEFAULT_TIMEOUT_MS = 30_000;

// ── Auth types ──────────────────────────────────────────────────────────

export interface BearerAuth {
  type: "bearer";
  clientId: string;
  clientSecret: string;
}

export interface ApiKeyAuth {
  type: "apiKey";
  clientId: string;
  apiKey: string;
}

export type Auth = BearerAuth | ApiKeyAuth;

// ── Client options ──────────────────────────────────────────────────────

export interface PayClientOptions {
  /** API root without /v2. */
  baseUrl: string;
  /** Authentication credentials. */
  auth: Auth;
  /** Request timeout in milliseconds (default 30 000). Ignored if custom fetch is provided. */
  timeoutMs?: number;
  /** Custom fetch implementation (replaces the default global fetch). */
  fetch?: typeof globalThis.fetch;
}

// ── Key conversion helpers ──────────────────────────────────────────────

function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (ch) => "_" + ch.toLowerCase());
}

function snakeToCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, ch: string) => ch.toUpperCase());
}

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

function convertKeys(
  obj: unknown,
  convert: (key: string) => string,
): unknown {
  if (Array.isArray(obj)) {
    return obj.map((item) => convertKeys(item, convert));
  }
  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[convert(key)] = convertKeys(value, convert);
    }
    return result;
  }
  return obj;
}

export function keysToSnake(obj: unknown): unknown {
  return convertKeys(obj, camelToSnake);
}

export function keysToCamel(obj: unknown): unknown {
  return convertKeys(obj, snakeToCamel);
}

// ── PayClient ───────────────────────────────────────────────────────────

export class PayClient {
  private readonly baseUrl: string;
  private readonly authHeaders: Record<string, string>;
  private readonly timeoutMs: number;
  private readonly fetchFn: typeof globalThis.fetch;
  private readonly hasCustomFetch: boolean;

  constructor(options: PayClientOptions) {
    if (!options.baseUrl) {
      throw new PayValidationError("baseUrl is required");
    }

    const { auth } = options;
    if (!auth) {
      throw new PayValidationError(
        "an auth option is required (use bearer or apiKey auth)",
      );
    }

    if (auth.type === "bearer") {
      if (!auth.clientId || !auth.clientSecret) {
        throw new PayValidationError(
          "clientId and clientSecret must not be empty",
        );
      }
      const token = btoa(`${auth.clientId}:${auth.clientSecret}`);
      this.authHeaders = { Authorization: `Bearer ${token}` };
    } else if (auth.type === "apiKey") {
      if (!auth.clientId || !auth.apiKey) {
        throw new PayValidationError("clientId and apiKey must not be empty");
      }
      this.authHeaders = {
        "X-Client-ID": auth.clientId,
        "X-API-Key": auth.apiKey,
      };
    } else {
      throw new PayValidationError(
        "an auth option is required (use bearer or apiKey auth)",
      );
    }

    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.hasCustomFetch = typeof options.fetch === "function";
    this.fetchFn = options.fetch ?? globalThis.fetch;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  // ── Internal helpers ────────────────────────────────────────────────

  private async do(
    method: string,
    path: string,
    body?: unknown,
    signal?: AbortSignal,
  ): Promise<Response> {
    const url = this.baseUrl + V2_PATH_PREFIX + path;

    const headers: Record<string, string> = { ...this.authHeaders };
    let reqBody: string | undefined;
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      reqBody = JSON.stringify(keysToSnake(body));
    }

    // Timeout handling: use AbortController when no custom fetch is provided.
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let fetchSignal = signal;

    if (!this.hasCustomFetch) {
      const controller = new AbortController();
      if (signal) {
        signal.addEventListener("abort", () => controller.abort(signal.reason), {
          once: true,
        });
      }
      timeoutId = setTimeout(() => controller.abort("timeout"), this.timeoutMs);
      fetchSignal = controller.signal;
    }

    try {
      return await this.fetchFn(url, {
        method,
        headers,
        body: reqBody,
        signal: fetchSignal,
      });
    } finally {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    }
  }

  private async parseError(resp: Response): Promise<PayApiError> {
    let msg: string | undefined;
    try {
      const body = (await resp.json()) as Partial<ErrorResponse>;
      msg = body.message || body.error;
    } catch {
      // ignore JSON parse failures
    }
    if (!msg) {
      msg = resp.statusText;
    }
    return new PayApiError(resp.status, msg);
  }

  // ── Public API ──────────────────────────────────────────────────────

  /**
   * Create a payment intent (POST /v2/intents).
   * Exactly one of request.email or request.recipient must be set.
   */
  async createIntent(
    request: CreateIntentRequest,
    signal?: AbortSignal,
  ): Promise<CreateIntentResponse> {
    if (!request) {
      throw new PayValidationError("CreateIntentRequest is required");
    }
    const resp = await this.do("POST", "/intents", request, signal);
    if (resp.status !== 201) {
      throw await this.parseError(resp);
    }
    return keysToCamel(await resp.json()) as CreateIntentResponse;
  }

  /**
   * Trigger transfer on Base using the Agent wallet
   * (POST /v2/intents/{intent_id}/execute).
   */
  async executeIntent(
    intentId: string,
    signal?: AbortSignal,
  ): Promise<ExecuteIntentResponse> {
    if (!intentId) {
      throw new PayValidationError("intent_id is required");
    }
    const resp = await this.do(
      "POST",
      `/intents/${encodeURIComponent(intentId)}/execute`,
      undefined,
      signal,
    );
    if (resp.status !== 200) {
      throw await this.parseError(resp);
    }
    return keysToCamel(await resp.json()) as ExecuteIntentResponse;
  }

  /**
   * Get intent status and receipt (GET /v2/intents?intent_id=...).
   */
  async getIntent(
    intentId: string,
    signal?: AbortSignal,
  ): Promise<GetIntentResponse> {
    if (!intentId) {
      throw new PayValidationError("intent_id is required");
    }
    const resp = await this.do(
      "GET",
      `/intents?intent_id=${encodeURIComponent(intentId)}`,
      undefined,
      signal,
    );
    if (resp.status !== 200) {
      throw await this.parseError(resp);
    }
    return keysToCamel(await resp.json()) as GetIntentResponse;
  }
}
