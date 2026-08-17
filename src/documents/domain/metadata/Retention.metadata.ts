interface RetentionMetadata {
    policyVersion: number;
	retentionScheduleId: string;
	retentionStartDate: Date;
	disposalEligibilityDate: Date;
	archivalRequired: boolean;
}

export type { RetentionMetadata };
