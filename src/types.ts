/** Supported chain identifiers for use as `payerChain` or `targetChain`. */
export const Chain = {
	/** Solana devnet (testnet). */
	SolanaDevnet: 'solana-devnet',
	/** Solana mainnet. */
	SolanaMainnet: 'solana-mainnet-beta',
	/** Base Sepolia (testnet). */
	BaseSepolia: 'base-sepolia',
	/** Base mainnet. */
	Base: 'base',
	/** BSC testnet. */
	BscTestnet: 'bsc-testnet',
	/** BSC mainnet. */
	Bsc: 'bsc',
	/** Polygon Amoy (testnet). */
	PolygonAmoy: 'polygon-amoy',
	/** Polygon mainnet. */
	Polygon: 'polygon',
	/** Arbitrum Sepolia (testnet). */
	ArbitrumSepolia: 'arbitrum-sepolia',
	/** Arbitrum mainnet. */
	Arbitrum: 'arbitrum',
	/** Ethereum Sepolia (testnet). */
	EthereumSepolia: 'ethereum-sepolia',
	/** Ethereum mainnet. */
	Ethereum: 'ethereum',
	/** Monad testnet. */
	MonadTestnet: 'monad-testnet',
	/** Monad mainnet. */
	Monad: 'monad',
	/** HyperEVM testnet. */
	HyperEvmTestnet: 'hyperevm-testnet',
	/** HyperEVM mainnet. */
	HyperEvm: 'hyperevm',
	/** SKALE Europa Liquidity Hub (payer-only). */
	SkaleBase: 'skale-base',
	/** SKALE Europa Liquidity Hub testnet (payer-only). */
	SkaleBaseSepolia: 'skale-base-sepolia',
	/** MegaETH (payer-only). */
	MegaEth: 'megaeth',
} as const;

export type ChainValue = (typeof Chain)[keyof typeof Chain];

/** Intent status constants returned by the API. */
export const IntentStatus = {
	AwaitingPayment: 'AWAITING_PAYMENT',
	Pending: 'PENDING',
	VerificationFailed: 'VERIFICATION_FAILED',
	SourceSettled: 'SOURCE_SETTLED',
	TargetSettling: 'TARGET_SETTLING',
	TargetSettled: 'TARGET_SETTLED',
	PartialSettlement: 'PARTIAL_SETTLEMENT',
	Expired: 'EXPIRED',
} as const;

export type IntentStatusValue =
	(typeof IntentStatus)[keyof typeof IntentStatus];

/** Body for POST /v2/intents. Exactly one of email or recipient must be set. */
export interface CreateIntentRequest {
	email?: string;
	recipient?: string;
	amount: string;
	payerChain: ChainValue | (string & {});
	/** Target chain for settlement. */
	targetChain: ChainValue | (string & {});
}

/** Fee details from the API. */
export interface FeeBreakdown {
	sourceChain: string;
	sourceChainFee: string;
	targetChain: string;
	targetChainFee: string;
	platformFee: string;
	platformFeePercentage: string;
	totalFee: string;
}

/**
 * X402 payment requirements returned inside CreateIntentResponse.
 * Note: `payTo`, `maxTimeoutSeconds`, and `extra` keys use camelCase per the
 * X402 protocol spec, not the API's usual snake_case convention.
 */
export interface PaymentRequirements {
	scheme: string;
	network: string;
	amount: string;
	payTo: string;
	maxTimeoutSeconds: number;
	asset: string;
	extra?: Record<string, unknown>;
}

/** Fields shared across all intent response types. */
export interface IntentBase {
	intentId: string;
	/**
	 * UUID of the agent that owns this intent. Populated for v2 endpoints
	 * (API Key auth) and omitted for the unauthenticated /api flow.
	 */
	agentId?: string;
	merchantRecipient: string;
	status: IntentStatusValue;
	createdAt: string;
	expiresAt: string;
}

/**
 * Intent response variant returned by create / execute / submit-proof flows.
 * The settlement quote (`sendingAmount`, `receivingAmount`, `estimatedFee`)
 * is always populated; `feeBreakdown` is omitted when the backend has no
 * detail to surface.
 */
export interface IntentSummary extends IntentBase {
	sendingAmount: string;
	receivingAmount: string;
	estimatedFee: string;
	feeBreakdown?: FeeBreakdown;
}

/** Response for POST /v2/intents (201). */
export interface CreateIntentResponse extends IntentSummary {
	email?: string;
	sourceRecipient?: string;
	payerChain: string;
	targetChain: string;
	paymentRequirements: PaymentRequirements;
}

/** Response for POST /v2/intents/{intent_id}/execute (200). */
export interface ExecuteIntentResponse extends IntentSummary {}

/** Response for POST /api/intents/{intent_id} (200) — alias for ExecuteIntentResponse. */
export type SubmitProofResponse = ExecuteIntentResponse;

/** Source-chain payment details from GetIntent. */
export interface SourcePayment {
	chain: string;
	txHash: string;
	settleProof: string;
	settledAt: string;
	explorerUrl: string;
}

/** Target-chain payment details from GetIntent. */
export interface TargetPayment {
	txHash: string;
	settleProof: string;
	settledAt: string;
	explorerUrl: string;
}

/**
 * Response for GET /v2/intents?intent_id=... (200).
 *
 * The settlement quote fields (`sendingAmount`, `receivingAmount`,
 * `estimatedFee`, `feeBreakdown`) are optional here — the backend only
 * populates them once the intent has progressed past the initial state.
 */
export interface GetIntentResponse extends IntentBase {
	sendingAmount?: string;
	receivingAmount?: string;
	estimatedFee?: string;
	feeBreakdown?: FeeBreakdown;
	payerChain: string;
	targetChain: string;
	receiverEmail?: string;
	payerWallet?: string;
	errorMessage?: string;
	completedAt?: string;
	sourcePayment?: SourcePayment;
	targetPayment?: TargetPayment;
}

/** Response for GET /chains (200). Lists chains supported at runtime. */
export interface SupportedChainsResponse {
	/** Chains usable as `payerChain` in CreateIntentRequest. */
	chains: string[];
	/** Chains usable as `targetChain` in CreateIntentRequest. */
	targetChains: string[];
}

/** Response for GET /v2/me (200). Identifies the calling agent. */
export interface Me {
	agentId: string;
	agentNumber: string;
	name: string;
	status: string;
	/** EVM wallet, omitted when the agent has no EVM wallet provisioned. */
	walletAddress?: string;
	/** Solana wallet, omitted when the agent has no Solana wallet provisioned. */
	solanaWalletAddress?: string;
}

/**
 * List-row entry returned by listIntents (GET /v2/intents/list).
 * Carries chain identifiers in addition to the IntentSummary fields.
 */
export interface ListIntentItem extends IntentSummary {
	payerChain: string;
	targetChain: string;
}

/** Response for GET /v2/intents/list (200). Paginated, most-recent-first. */
export interface ListIntentsResponse {
	intents: ListIntentItem[];
	total: number;
	page: number;
	pageSize: number;
}

/**
 * Options for listIntents.
 * - `page` is 1-indexed; omit (or pass `undefined`) to use the server default of 1.
 * - `pageSize` must be in [1,100]; omit to use the server default of 20.
 */
export interface ListIntentsOptions {
	page?: number;
	pageSize?: number;
}
