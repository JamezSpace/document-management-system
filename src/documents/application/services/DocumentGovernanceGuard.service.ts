import type { DocumentGovernanceContextPort } from "../../../shared/application/port/intersubsystem/DocumentGovernanceContext.port.js";
import type {
	DocumentGovernanceAction,
	DocumentGovernanceFacts,
	DocumentGovernancePolicyPort,
} from "../../../shared/application/port/intersubsystem/DocumentGovernancePolicy.port.js";
import ApplicationError from "../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../shared/errors/enum/application.enum.js";
import type Document from "../../domain/entities/document/Document.js";
import type DocumentGovernanceObligationExecutor from "./DocumentGovernanceObligationExecutor.service.js";

class DocumentGovernanceGuard {
	constructor(
		private readonly policy: DocumentGovernancePolicyPort,
		private readonly contexts: DocumentGovernanceContextPort,
		private readonly obligations: DocumentGovernanceObligationExecutor,
	) {}

	async authorize(
		document: Document,
		actorStaffId: string,
		action: DocumentGovernanceAction,
		overrides: Partial<DocumentGovernanceFacts> = {},
	) {
		const policyId = document.classification.governancePolicyKey;
		const policyVersion = document.classification.governancePolicyVersion;
		if (!policyId || !policyVersion) {
			throw new ApplicationError(ApplicationErrorEnum.POLICY_NOT_FOUND, {
				message: `Document '${document.id}' is not bound to a governance policy version`,
			});
		}
		const context = await this.contexts.resolve(document.id, actorStaffId);
		const decision = await this.policy.evaluateAction(
			action,
			{
				sensitivity: document.classification.sensitivity,
				...context,
				...overrides,
			},
			{
				policyId,
				policyVersion,
			},
		);

		if (!decision.allowed) {
			await this.obligations.execute({
				decision,
				actorStaffId,
				documentId: document.id,
				action,
				outcome: "denied",
			});
			throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, {
				message: `Document governance denied '${action}'`,
				details: {
					documentId: document.id,
					reasonCode: decision.reasonCode,
					policyId: decision.policyId,
					policyVersion: decision.policyVersion,
				},
			});
		}
		await this.obligations.execute({
			decision,
			actorStaffId,
			documentId: document.id,
			action,
			outcome: "success",
		});

		return { decision, context };
	}
}

export default DocumentGovernanceGuard;
