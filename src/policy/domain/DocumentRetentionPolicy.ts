interface DocumentRetentionPolicyPayload {
    id: string;
    archivalRequired: boolean;
    policyVersion?: number;
    retentionDuration: number;
    documentTypeId: string;
    effectiveFrom: Date;
    createdAt?: Date;
}

class DocumentRetentionPolicy {
    readonly id: string;
    readonly policyVersion: number | null;
    readonly archivalRequired: boolean;
    readonly documentTypeId: string;
    readonly retentionDuration: number;
    readonly effectiveFrom: Date;
    readonly createdAt: Date;

    constructor(payload: DocumentRetentionPolicyPayload) {
        this.id = payload.id;
        this.documentTypeId = payload.documentTypeId;
        this.retentionDuration = payload.retentionDuration;
        this.policyVersion = payload.policyVersion ?? null;
        this.archivalRequired = payload.archivalRequired;
        this.effectiveFrom = payload.effectiveFrom;
        this.createdAt = payload.createdAt ?? new Date()
    }

    requiresArchival() {
        return this.archivalRequired;
    }
}

export default DocumentRetentionPolicy;