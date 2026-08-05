import ApiError from "../../../../shared/errors/NexusError.js";
import { ApiErrorEnum } from "../../../../shared/errors/enum/api.enum.js";
import WorkspacePolicyEvaluator from "../../application/services/WorkspacePolicyEvaluator.js";
import type GetActorUsecase from "../../application/usecases/GetActor.usecase.js";
import type GetDocumentUsecase from "../../application/usecases/GetDocument.usecase.js";
import type GetWorkflowContextUsecase from "../../application/usecases/GetWorkflowContext.usecase.js";

class WorkspaceController {
    constructor(
        private readonly getDocumentUsecase: GetDocumentUsecase,
        private readonly getActorUsecase: GetActorUsecase,
        private readonly getWorkflowContextUsecase: GetWorkflowContextUsecase
    ){}

    // remember to confirm if uid access token is same as staffId passed in the request to disallow spoofing bug where user steals a uid and uses it to fetch staff information, that is, even in the event of theft, the user should only be able to see the information belonging to that user with the uid
    async resolveWorkspacePermissions(documentId: string, actorUid: string) {
        // fetch document
        const document = await this.getDocumentUsecase.execute(documentId);
        const staffActor = await this.getActorUsecase.execute(actorUid);
        const workflowContext = await this.getWorkflowContextUsecase.execute(documentId);

        if(!document) 
            throw new ApiError(ApiErrorEnum.NOT_FOUND, {
                message: 'Document not found'
            });

        if(!staffActor) 
            throw new ApiError(ApiErrorEnum.NOT_FOUND, {
                message: 'Actor not found'
            });

        if(!workflowContext) 
            throw new ApiError(ApiErrorEnum.NOT_FOUND, {
                message: `Workflow for doc ${documentId} not found`
            });
        
        const permissions = await WorkspacePolicyEvaluator.eval(document, workflowContext, staffActor);
        return permissions;
    }
}

export default WorkspaceController;