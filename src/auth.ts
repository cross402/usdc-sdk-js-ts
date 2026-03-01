import { PayValidationError } from "./errors.js";

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

/**
 * Build auth headers from credentials.
 * Throws PayValidationError if auth is invalid.
 */
export function buildAuthHeaders(auth: Auth): Record<string, string> {
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
    // NOTE: The upstream API expects base64-encoded credentials in a Bearer
    // header. This is intentional and not standard HTTP Basic auth.
    const token = Buffer.from(
      `${auth.clientId}:${auth.clientSecret}`,
    ).toString("base64");
    return { Authorization: `Bearer ${token}` };
  }

  if (auth.type === "apiKey") {
    if (!auth.clientId || !auth.apiKey) {
      throw new PayValidationError("clientId and apiKey must not be empty");
    }
    return {
      "X-Client-ID": auth.clientId,
      "X-API-Key": auth.apiKey,
    };
  }

  throw new PayValidationError(
    "an auth option is required (use bearer or apiKey auth)",
  );
}
