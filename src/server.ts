/**
 * Server-side entry point. Use when you have apiKey + secretKey.
 * Do NOT use in browser/client bundles — credentials must stay on the server.
 */

export type { Auth } from './auth.js';
export type { PayClientOptions } from './client.js';
export { PayClient } from './client.js';
export { PayApiError, PayValidationError } from './errors.js';
export type {
	ChainValue,
	CreateIntentRequest,
	CreateIntentResponse,
	ExecuteIntentResponse,
	FeeBreakdown,
	GetIntentResponse,
	IntentBase,
	IntentStatusValue,
	IntentSummary,
	ListIntentItem,
	ListIntentsOptions,
	ListIntentsResponse,
	Me,
	PaymentRequirements,
	SourcePayment,
	SupportedChainsResponse,
	TargetPayment,
} from './types.js';
export { Chain, IntentStatus } from './types.js';
