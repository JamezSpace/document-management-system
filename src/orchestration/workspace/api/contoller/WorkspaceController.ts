import ApiError from "../../../../shared/errors/NexusError.js";
import { ApiErrorEnum } from "../../../../shared/errors/enum/api.enum.js";
import ApplicationError from "../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../shared/errors/enum/application.enum.js";
import type { DocumentGovernancePolicyPort } from "../../../../shared/application/port/intersubsystem/DocumentGovernancePolicy.port.js";
import type { DocumentGovernanceContextPort } from "../../../../shared/application/port/intersubsystem/DocumentGovernanceContext.port.js";
import WorkspacePolicyEvaluator from "../../application/services/WorkspacePolicyEvaluator.js";
import DocumentCanvasProjector, { type CanvasKind } from "../../application/services/DocumentCanvasProjector.js";
import type { DocumentGovernanceAuditPort } from "../../../../shared/application/port/intersubsystem/DocumentGovernanceAudit.port.js";
import type GetDocumentUsecase from "../../application/usecases/GetDocument.usecase.js";
import type GetWorkflowContextUsecase from "../../application/usecases/GetWorkflowContext.usecase.js";

class WorkspaceController {
	constructor(
		private readonly getDocumentUsecase: GetDocumentUsecase,
		private readonly getWorkflowContextUsecase: GetWorkflowContextUsecase,
		private readonly documentGovernancePolicy: DocumentGovernancePolicyPort,
		private readonly documentGovernanceContext: DocumentGovernanceContextPort,
		private readonly documentGovernanceAudit: DocumentGovernanceAuditPort,
	) {}

	async resolveWorkspacePermissions(
		documentId: string,
		actorStaffId: string,
		canvas: CanvasKind,
	) {
		// fetch necessary items for workspace
		const staffActor = { id: actorStaffId };
		const document = await this.getDocumentUsecase.execute(documentId);

		if (!document)
			throw new ApiError(ApiErrorEnum.NOT_FOUND, {
				message: "Document not found",
			});

		const governanceContext = await this.documentGovernanceContext.resolve(
			documentId,
			actorStaffId,
		);
		const policyReference = {
			policyId: document.classification.governancePolicyKey!,
			policyVersion: document.classification.governancePolicyVersion!,
		};
		const viewDecision = await this.documentGovernancePolicy.evaluateAction(
			"view",
			{
				sensitivity: document.classification.sensitivity,
				...governanceContext,
			},
			policyReference,
		);
		if (!viewDecision.allowed) {
			await this.documentGovernanceAudit.record({
				actorStaffId,
				documentId,
				action: "view",
				outcome: "denied",
				reasonCode: viewDecision.reasonCode,
				policyId: viewDecision.policyId,
				policyVersion: viewDecision.policyVersion,
				obligations: viewDecision.obligations,
			});
			const useGuestGrantError = document.classification.sensitivity === "confidential";
			const grantError = useGuestGrantError && governanceContext.guestReaderGrantStatus === "expired"
				? ApplicationErrorEnum.GRANT_EXPIRED
				: useGuestGrantError && governanceContext.guestReaderGrantStatus === "revoked"
					? ApplicationErrorEnum.GRANT_REVOKED
					: ApplicationErrorEnum.NOT_ALLOWED;
			throw new ApplicationError(grantError, {
				message: "Document governance denied workspace access",
				details: { documentId, reasonCode: viewDecision.reasonCode },
			});
		}
		if (viewDecision.obligations.includes("audit_security_event")) {
			await this.documentGovernanceAudit.record({
				actorStaffId,
				documentId,
				action: "view",
				outcome: "success",
				reasonCode: viewDecision.reasonCode,
				policyId: viewDecision.policyId,
				policyVersion: viewDecision.policyVersion,
				obligations: viewDecision.obligations,
			});
		}

		const workflowContext =
			await this.getWorkflowContextUsecase.execute(documentId);

		const permissions = await WorkspacePolicyEvaluator.eval(
			document,
			workflowContext,
			staffActor.id,
			governanceContext,
			this.documentGovernancePolicy,
		);
		const canvasProjection = await DocumentCanvasProjector.project(
			document,
			canvas,
			governanceContext,
			this.documentGovernancePolicy,
		);

		return {
			...permissions,
			metadata: {
				...permissions.metadata,
				document: canvasProjection.document,
			},
			canvas: canvasProjection.ccHeader,
		};
	}
}

export default WorkspaceController;
