import { z } from 'zod';
import {
	createIntentRequestSchema,
	intentIdSchema,
	settleProofSchema,
} from '../schemas.js';

// ── Config ──────────────────────────────────────────────────────────────────

export const cliConfigSchema = z.object({
	apiKey: z.string().min(1, 'apiKey is required'),
	secretKey: z.string().min(1, 'secretKey is required'),
	baseUrl: z.string().url('baseUrl must be a valid URL').min(1),
});

export type CliConfig = z.infer<typeof cliConfigSchema>;

// ── Auth set ────────────────────────────────────────────────────────────────

export const authSetSchema = z.object({
	apiKey: z.string().min(1, 'apiKey is required'),
	secretKey: z.string().min(1, 'secretKey is required'),
	baseUrl: z.string().url('baseUrl must be a valid URL').min(1),
});

// ── Balance read ────────────────────────────────────────────────────────────

const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export const ethAddressSchema = z
	.string()
	.min(1, 'address is required')
	.regex(ETH_ADDRESS_REGEX, 'address must be 0x + 40 hex chars');

export const balanceReadSchema = z.object({
	address: ethAddressSchema,
	rpcUrl: z.string().url('rpcUrl must be a valid URL').min(1),
});

// ── Intent create ───────────────────────────────────────────────────────────

export { createIntentRequestSchema };

// ── Intent submit-proof ─────────────────────────────────────────────────────

export const submitProofOptionsSchema = z.object({
	intentId: intentIdSchema,
	proof: settleProofSchema,
	baseUrl: z.string().url('baseUrl must be a valid URL').min(1),
});

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Parse with schema; on failure print error to stderr and exit(1).
 */
export function parseOrExit<T>(schema: z.ZodType<T>, value: unknown): T {
	const result = schema.safeParse(value);
	if (result.success) {
		return result.data;
	}
	const err = result.error;
	const first = err.errors[0];
	const message = first?.message ?? err.message;
	console.error(`Error: ${message}`);
	process.exit(1);
}
