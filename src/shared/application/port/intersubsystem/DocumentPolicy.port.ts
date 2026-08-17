interface DocumentRetentionPolicyPort {
	getRetentionData(
		documentTypeId: string,
	): Promise<{
		duration: number;
		archivalRequired: boolean;
		policyVersion: number;
        retentionScheduleId: string
	}>;
}

export type { DocumentRetentionPolicyPort };

