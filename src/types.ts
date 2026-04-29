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
	merchantRecipient: string;
	sendingAmount: string;
	receivingAmount: string;
	estimatedFee: string;
	feeBreakdown: FeeBreakdown;
	status: IntentStatusValue;
	createdAt: string;
	expiresAt: string;
}

/** Response for POST /v2/intents (201). */
export interface CreateIntentResponse extends IntentBase {
	email?: string;
	sourceRecipient?: string;
	payerChain: string;
	targetChain: string;
	paymentRequirements: PaymentRequirements;
}

/** Response for POST /v2/intents/{intent_id}/execute (200). */
export interface ExecuteIntentResponse extends IntentBase {}

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

/** Response for GET /v2/intents?intent_id=... (200). */
export interface GetIntentResponse extends IntentBase {
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
