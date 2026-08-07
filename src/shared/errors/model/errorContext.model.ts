interface ErrorContextBase {
	details?: Record<string, unknown>;
	cause?: unknown;
}

interface NexusErrorContext extends ErrorContextBase {
	message: string;
}

interface ApplicationErrorContext extends ErrorContextBase {
	message?: string;
}

interface DomainErrorContext extends ErrorContextBase {
	message?: string;
	currentState?: string | null;
	targetState?: string;
}

interface InfrastructureErrorContext extends ErrorContextBase {
	message: string;
	category: string;
	table?: string;
	column?: string;
}

export type {
	ApplicationErrorContext,
	DomainErrorContext,
	InfrastructureErrorContext,
	NexusErrorContext,
};
