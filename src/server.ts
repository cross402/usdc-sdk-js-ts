/**
 * Server-side entry point. Use when you have apiKey + secretKey.
 * Do NOT use in browser/client bundles — credentials must stay on the server.
 */

export type { Auth } from './auth.js';
export type { PayClientOptions } from './client.js';
export { PayClient } from './client.js';
export { PayApiError, PayValidationError } from './errors.js';
export type {
	AssetValue,
	ChainValue,
	CreateIntentRequest,
	CreateIntentResponse,
	ExecuteIntentResponse,
	FeeBreakdown,
	GetIntentResponse,
	IntentBase,
	IntentListItem,
	IntentStatusValue,
	IntentSummary,
	ListIntentsParams,
	ListIntentsResponse,
	MeResponse,
	PaymentRequirements,
	SourcePayment,
	SupportedChainsResponse,
	SwapApprovalParams,
	SwapApprovalResponse,
	SwapApprovalTransaction,
	SwapStatusParams,
	SwapStatusResponse,
	TargetPayment,
} from './types.js';
export { Asset, Chain, IntentStatus } from './types.js';
