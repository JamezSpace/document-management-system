import ApiError from "../../../../shared/errors/NexusError.js";
import { ApiErrorEnum } from "../../../../shared/errors/enum/api.enum.js";
import type { DocumentGovernancePolicyPort } from "../../../../shared/application/port/intersubsystem/DocumentGovernancePolicy.port.js";
import WorkspacePolicyEvaluator from "../../application/services/WorkspacePolicyEvaluator.js";
import type GetDocumentUsecase from "../../application/usecases/GetDocument.usecase.js";
import type GetWorkflowContextUsecase from "../../application/usecases/GetWorkflowContext.usecase.js";

class WorkspaceController {
	constructor(
		private readonly getDocumentUsecase: GetDocumentUsecase,
		private readonly getWorkflowContextUsecase: GetWorkflowContextUsecase,
		private readonly documentGovernancePolicy: DocumentGovernancePolicyPort,
	) {}

	async resolveWorkspacePermissions(documentId: string, actorStaffId: string) {
		// fetch necessary items for workspace
		const staffActor = { id: actorStaffId };
		const document = await this.getDocumentUsecase.execute(documentId);

		if (!document)
			throw new ApiError(ApiErrorEnum.NOT_FOUND, {
				message: "Document not found",
			});

		const workflowContext =
			await this.getWorkflowContextUsecase.execute(documentId);

		const permissions = await WorkspacePolicyEvaluator.eval(
			document,
			workflowContext,
			staffActor,
			this.documentGovernancePolicy,
		);
		return permissions;
	}
}

export default WorkspaceController;
