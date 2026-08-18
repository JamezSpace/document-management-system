interface DocumentRetentionPolicyPayload {
	id: string;
	archivalRequired: boolean;
	policyVersion?: number;
	retentionDuration: number;
	documentTypeId: string;
	effectiveFrom: Date;
	createdAt?: Date;
}

export type { DocumentRetentionPolicyPayload };
