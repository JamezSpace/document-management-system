import { type WorkflowContext } from "../../../../shared/application/port/intersubsystem/OrcestrationWorkflow.port.js";
import {
	DocumentCorrespondenceDirection,
	DocumentLifecycleState,
	type Document,
} from "../../../../shared/application/port/intersubsystem/OrchestrationDocument.port.js";
import type { Staff } from "../../../../shared/application/port/intersubsystem/OrchestrationIdentity.port.js";
import { WorkspaceActions } from "../enum/WorkspaceActions.enum.js";

class WorkspacePolicyEvaluator {
	static workspaceInitMode: "edit" | "readonly";

	static isActorTheAuthor(document: Document, actor: Staff) {
		return document.ownerId === actor.id;
	}

	static getWorkspaceInitMode(document: Document, isAuthor: boolean) {
		// null lifecycle state covers for a just created document with no content yet
		const docState = document.getCurrentVersion()?.getState() ?? null;
		const isDocEditable =
			!docState || docState === DocumentLifecycleState.DRAFT;

		if (isAuthor && isDocEditable) return "edit";

		return "readonly";
	}

	static getAuthorizedBasicActions(document: Document): WorkspaceActions[] {
		const actions: WorkspaceActions[] = [];
		const docState = document.getCurrentVersion()?.getState() ?? null;

		// caters for actions dependent on just lifecycle state
		switch (docState) {
            case null:
			case DocumentLifecycleState.DRAFT:
				actions.push(
					WorkspaceActions.EDIT,
					WorkspaceActions.SAVE,
					WorkspaceActions.DISPATCH,
				);
				break;
			case DocumentLifecycleState.ACTIVE:
				actions.push(WorkspaceActions.EXPORT);
				break;
		}

		return actions;
	}

	static getAuthorizedWorkflowActions(
		document: Document,
		workflowContext: WorkflowContext | null,
	): WorkspaceActions[] {
		const actions: WorkspaceActions[] = [];
		const docDirection = document.correspondence.direction;
        const docState = document.getCurrentVersion()?.getState() ?? null;

        // internal docs dont have any workflow associated with them
		if (docDirection === DocumentCorrespondenceDirection.INTERNAL) {
            if(docState === DocumentLifecycleState.ACTIVE)
			    actions.push(WorkspaceActions.DISPATCH);
			return actions;
		}

        // docs that arent in review dont have any ongoing workflow
		if (
			docState !== DocumentLifecycleState.IN_REVIEW ||
			!workflowContext
		)
            return actions;

		const canAdvanceResult = this.canAdvance(workflowContext);
		const canRejectResult = this.canReject(workflowContext);

		if (canAdvanceResult) 
            actions.push(WorkspaceActions.ADVANCE);
		if (canRejectResult) 
            actions.push(WorkspaceActions.REJECT);

        return actions
	}

	static canAdvance(workflowContext: WorkflowContext): boolean {
		return workflowContext.canAdvance;
	}

	static canReject(workflowContext: WorkflowContext): boolean {
		return workflowContext.canReject;
	}

    static canCC(
        document: Document,
        isAuthor: boolean
    ): boolean {
        const docState = document.getCurrentVersion()?.getState() ?? null;

        // just initialized docs or draft docs can be CC'd
        if (!docState || docState === DocumentLifecycleState.DRAFT) {
            return isAuthor;
        }

        return false;
    }

    static canAcknowledge(isAuthor: boolean) {
        // non-authors must acknowledge
        return !isAuthor;
    }

    static canAttach(document: Document) {
        const docState = document.getCurrentVersion()?.getState() ?? null;

        const canAttach = [null, DocumentLifecycleState.DRAFT, DocumentLifecycleState.IN_REVIEW].includes(docState)

        return canAttach;
    }

	static async eval(
		document: Document,
		workflowContext: WorkflowContext | null,
		actor: Staff,
	) {
		// find if actor is author
		const isActorTheAuthor = this.isActorTheAuthor(document, actor);

		// load workspace mode
		this.workspaceInitMode = this.getWorkspaceInitMode(document, isActorTheAuthor);

		const authorizedBasicActions = this.getAuthorizedBasicActions(document);
		const authorizedWorkflowActions = this.getAuthorizedWorkflowActions(document, workflowContext);

		const authorizedActions: WorkspaceActions[] = [
			...authorizedBasicActions,
			...authorizedWorkflowActions,
		];

        if(this.canCC(document, isActorTheAuthor))
            authorizedActions.push(WorkspaceActions.CC);

        if(this.canAcknowledge(isActorTheAuthor))
            authorizedActions.push(WorkspaceActions.ACKNOWLEDGE);
        
        if(this.canAttach(document))
            authorizedActions.push(WorkspaceActions.ATTACH);


		return {
			mode: this.workspaceInitMode,
			authorizedActions,
			workflow: workflowContext,
            metadata: {
                isAuthor: isActorTheAuthor,
                document
            }
		};
	}
}

export default WorkspacePolicyEvaluator;
