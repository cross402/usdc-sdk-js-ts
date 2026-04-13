import { authSchema, parseOrThrow } from './schemas.js';

export interface Auth {
	apiKey: string;
	secretKey: string;
}

/**
 * Build auth headers from credentials.
 * Throws PayValidationError if auth is invalid.
 */
export function buildAuthHeaders(auth: Auth): Record<string, string> {
	const validated = parseOrThrow(authSchema, auth);
	// NOTE: The upstream API expects base64-encoded credentials in a Bearer
	// header. This is intentional and not standard HTTP Basic auth.
	const token = Buffer.from(`${validated.apiKey}:${validated.secretKey}`).toString(
		'base64',
	);
	return { Authorization: `Bearer ${token}` };
}
