import type { DocumentGovernanceAuditPort } from "../../../shared/application/port/intersubsystem/DocumentGovernanceAudit.port.js";
import type { DocumentGovernanceDecision } from "../../../shared/application/port/intersubsystem/DocumentGovernancePolicy.port.js";

class DocumentGovernanceObligationExecutor {
	constructor(private readonly audit: DocumentGovernanceAuditPort) {}

	async execute(payload: {
		decision: DocumentGovernanceDecision;
		actorStaffId: string;
		documentId: string;
		action: string;
		outcome: "success" | "denied" | "failed";
		metadata?: Record<string, unknown>;
	}) {
		const requiresSecurityAudit =
			payload.outcome === "denied" ||
			payload.decision.obligations.includes("audit_security_event") ||
			payload.decision.obligations.includes("audit_justification");
		if (!requiresSecurityAudit) return;

		await this.audit.record({
			actorStaffId: payload.actorStaffId,
			documentId: payload.documentId,
			action: payload.action,
			outcome: payload.outcome,
			reasonCode: payload.decision.reasonCode,
			policyId: payload.decision.policyId,
			policyVersion: payload.decision.policyVersion,
			obligations: payload.decision.obligations,
			...(payload.metadata ? { metadata: payload.metadata } : {}),
		});
	}
}

export default DocumentGovernanceObligationExecutor;
