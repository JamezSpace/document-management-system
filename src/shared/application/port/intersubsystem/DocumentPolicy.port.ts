interface DocumentRetentionPolicyPort {
	getRetentionData(
		documentTypeId: string,
		effectiveAt: Date,
	): Promise<{
		duration: number;
		archivalRequired: boolean;
		policyVersion: number;
		retentionScheduleId: string;
	} | null>;
}

export type { DocumentRetentionPolicyPort };

