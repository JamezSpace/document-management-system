import { type WorkflowContext } from "../../../../shared/application/port/intersubsystem/OrcestrationWorkflow.port.js";
import {
	DocumentCorrespondenceDirection,
	DocumentLifecycleState,
	type Document,
} from "../../../../shared/application/port/intersubsystem/OrchestrationDocument.port.js";
import type { Staff } from "../../../../shared/application/port/intersubsystem/OrchestrationIdentity.port.js";
import type { DocumentGovernancePolicyPort } from "../../../../shared/application/port/intersubsystem/DocumentGovernancePolicy.port.js";
import type { GovernancePolicyReference } from "../../../../shared/application/port/intersubsystem/DocumentGovernancePolicy.port.js";
import ApplicationError from "../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../shared/errors/enum/application.enum.js";
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

	static async getAuthorizedBasicActions(
		document: Document,
		isAuthor: boolean,
		documentGovernancePolicy: DocumentGovernancePolicyPort,
		policyReference: GovernancePolicyReference,
	): Promise<WorkspaceActions[]> {
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
				if (
					(await documentGovernancePolicy.evaluateWorkspaceAction("export", {
						sensitivity: document.classification.sensitivity,
						isAuthor,
						isAuthenticatedInternalStaff: true,
					}, policyReference)).allowed
				) {
					actions.push(WorkspaceActions.EXPORT);
				}
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

	static async canCC(
		document: Document,
		isAuthor: boolean,
		documentGovernancePolicy: DocumentGovernancePolicyPort,
		policyReference: GovernancePolicyReference,
	): Promise<boolean> {
		const docState = document.getCurrentVersion()?.getState() ?? null;
		const governanceDecision = await documentGovernancePolicy.evaluateWorkspaceAction(
			"manage_cc",
			{
				sensitivity: document.classification.sensitivity,
				isAuthor,
				isAuthenticatedInternalStaff: true,
			},
			policyReference,
		);

		// just initialized docs or draft docs can be CC'd
		if (!docState || docState === DocumentLifecycleState.DRAFT) {
			return governanceDecision.allowed;
		}

		return false;
	}

    static canAcknowledge(isAuthor: boolean) {
        // non-authors must acknowledge
        return !isAuthor;
    }

	static async canAttach(
		document: Document,
		isAuthor: boolean,
		documentGovernancePolicy: DocumentGovernancePolicyPort,
		policyReference: GovernancePolicyReference,
	) {
		const docState = document.getCurrentVersion()?.getState() ?? null;

		const canAttach = [
			null,
			DocumentLifecycleState.DRAFT,
			DocumentLifecycleState.IN_REVIEW,
		].includes(docState);
		const governanceDecision = await documentGovernancePolicy.evaluateWorkspaceAction(
			"attach",
			{
				sensitivity: document.classification.sensitivity,
				isAuthor,
				isAuthenticatedInternalStaff: true,
			},
			policyReference,
		);

		return canAttach && governanceDecision.allowed;
	}

	static async eval(
		document: Document,
		workflowContext: WorkflowContext | null,
		actor: Staff,
		documentGovernancePolicy: DocumentGovernancePolicyPort,
	) {
		// find if actor is author
		const isActorTheAuthor = this.isActorTheAuthor(document, actor);
		const policyReference = this.getBoundPolicyReference(document);

		// load workspace mode
		this.workspaceInitMode = this.getWorkspaceInitMode(document, isActorTheAuthor);

		const authorizedBasicActions = await this.getAuthorizedBasicActions(
			document,
			isActorTheAuthor,
			documentGovernancePolicy,
			policyReference,
		);
		const authorizedWorkflowActions = this.getAuthorizedWorkflowActions(document, workflowContext);

		const authorizedActions: WorkspaceActions[] = [
			...authorizedBasicActions,
			...authorizedWorkflowActions,
		];

		if (await this.canCC(document, isActorTheAuthor, documentGovernancePolicy, policyReference))
			authorizedActions.push(WorkspaceActions.CC);

        if(this.canAcknowledge(isActorTheAuthor))
            authorizedActions.push(WorkspaceActions.ACKNOWLEDGE);
        
		if (await this.canAttach(document, isActorTheAuthor, documentGovernancePolicy, policyReference))
			authorizedActions.push(WorkspaceActions.ATTACH);


		return {
			mode: this.workspaceInitMode,
			authorizedActions,
			workflow: workflowContext,
			governance: policyReference,
			metadata: {
				isAuthor: isActorTheAuthor,
				document,
			},
		};
	}

	private static getBoundPolicyReference(document: Document): GovernancePolicyReference {
		const policyId = document.classification.governancePolicyKey;
		const policyVersion = document.classification.governancePolicyVersion;
		if (!policyId || !policyVersion) {
			throw new ApplicationError(ApplicationErrorEnum.POLICY_NOT_FOUND, {
				message: `Document '${document.id}' is not bound to a governance policy version`,
			});
		}
		return { policyId, policyVersion };
	}
}

export default WorkspacePolicyEvaluator;
