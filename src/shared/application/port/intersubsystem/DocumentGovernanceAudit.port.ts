interface DocumentGovernanceAuditEvent {
	actorStaffId: string;
	documentId: string;
	action: string;
	outcome: "success" | "denied" | "failed";
	reasonCode: string;
	policyId: string;
	policyVersion: number;
	obligations?: string[];
	requestId?: string | null;
	ipAddress?: string | null;
	deviceFingerprint?: string | null;
	metadata?: Record<string, unknown>;
}

interface DocumentGovernanceAuditPort {
	record(event: DocumentGovernanceAuditEvent): Promise<void>;
}

export type { DocumentGovernanceAuditEvent, DocumentGovernanceAuditPort };
