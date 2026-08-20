import { type WorkflowContext } from "../../../../shared/application/port/intersubsystem/OrcestrationWorkflow.port.js";
import {
	DocumentCorrespondenceDirection,
	DocumentLifecycleState,
	type Document,
} from "../../../../shared/application/port/intersubsystem/OrchestrationDocument.port.js";
import type { ResolvedDocumentGovernanceContext } from "../../../../shared/application/port/intersubsystem/DocumentGovernanceContext.port.js";
import type { DocumentGovernancePolicyPort } from "../../../../shared/application/port/intersubsystem/DocumentGovernancePolicy.port.js";
import type { GovernancePolicyReference } from "../../../../shared/application/port/intersubsystem/DocumentGovernancePolicy.port.js";
import ApplicationError from "../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../shared/errors/enum/application.enum.js";
import { WorkspaceActions } from "../enum/WorkspaceActions.enum.js";

class WorkspacePolicyEvaluator {
	static workspaceInitMode: "edit" | "readonly";

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
		governanceContext: ResolvedDocumentGovernanceContext,
		documentGovernancePolicy: DocumentGovernancePolicyPort,
		policyReference: GovernancePolicyReference,
	): Promise<WorkspaceActions[]> {
		const actions: WorkspaceActions[] = [];
		const docState = document.getCurrentVersion()?.getState() ?? null;

		// caters for actions dependent on just lifecycle state
		switch (docState) {
            case null:
			case DocumentLifecycleState.DRAFT:
				if (isAuthor) {
					actions.push(
						WorkspaceActions.EDIT,
						WorkspaceActions.SAVE,
						WorkspaceActions.DISPATCH,
					);
				}
				break;
			case DocumentLifecycleState.ACTIVE:
				if (
					(await documentGovernancePolicy.evaluateAction("export", {
						sensitivity: document.classification.sensitivity,
						...governanceContext,
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
		governanceContext: ResolvedDocumentGovernanceContext,
		documentGovernancePolicy: DocumentGovernancePolicyPort,
		policyReference: GovernancePolicyReference,
	): Promise<boolean> {
		const docState = document.getCurrentVersion()?.getState() ?? null;
		const governanceDecision = await documentGovernancePolicy.evaluateAction(
			"manage_cc",
			{
				sensitivity: document.classification.sensitivity,
				...governanceContext,
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
		governanceContext: ResolvedDocumentGovernanceContext,
		documentGovernancePolicy: DocumentGovernancePolicyPort,
		policyReference: GovernancePolicyReference,
	) {
		const docState = document.getCurrentVersion()?.getState() ?? null;

		const canAttach = [
			null,
			DocumentLifecycleState.DRAFT,
			DocumentLifecycleState.IN_REVIEW,
		].includes(docState as null | "draft" | "in_review");
		const governanceDecision = await documentGovernancePolicy.evaluateAction(
			"attach",
			{
				sensitivity: document.classification.sensitivity,
				...governanceContext,
			},
			policyReference,
		);

		return canAttach && governanceDecision.allowed;
	}

	static async eval(
		document: Document,
		workflowContext: WorkflowContext | null,
		actorStaffId: string,
		governanceContext: ResolvedDocumentGovernanceContext,
		documentGovernancePolicy: DocumentGovernancePolicyPort,
	) {
		// find if actor is author
		const isActorTheAuthor = document.ownerId === actorStaffId;
		const policyReference = this.getBoundPolicyReference(document);

		// load workspace mode
		this.workspaceInitMode = this.getWorkspaceInitMode(document, isActorTheAuthor);

		const authorizedBasicActions = await this.getAuthorizedBasicActions(
			document,
			isActorTheAuthor,
			governanceContext,
			documentGovernancePolicy,
			policyReference,
		);
		const authorizedWorkflowActions = this.getAuthorizedWorkflowActions(document, workflowContext);

		const authorizedActions: WorkspaceActions[] = [
			...authorizedBasicActions,
			...authorizedWorkflowActions,
		];

		if (await this.canCC(document, governanceContext, documentGovernancePolicy, policyReference))
			authorizedActions.push(WorkspaceActions.CC);

        if(this.canAcknowledge(isActorTheAuthor))
            authorizedActions.push(WorkspaceActions.ACKNOWLEDGE);
        
		if (await this.canAttach(document, governanceContext, documentGovernancePolicy, policyReference))
			authorizedActions.push(WorkspaceActions.ATTACH);

		const [exportDecision, printDecision] = await Promise.all([
			documentGovernancePolicy.evaluateAction("export", {
				sensitivity: document.classification.sensitivity,
				...governanceContext,
			}, policyReference),
			documentGovernancePolicy.evaluateAction("print", {
				sensitivity: document.classification.sensitivity,
				...governanceContext,
			}, policyReference),
		]);
		const extractionDirective = (decision: typeof exportDecision) => ({
			allowed: decision.allowed,
			reasonCode: decision.reasonCode,
			obligations: decision.obligations,
			deliveryMode: decision.obligations.some((item) => item.includes("watermark"))
				? "server_rendered_only" as const
				: "direct" as const,
		});


		return {
			mode: this.workspaceInitMode,
			authorizedActions,
			workflow: workflowContext,
			governance: {
				...policyReference,
				extraction: {
					export: extractionDirective(exportDecision),
					print: extractionDirective(printDecision),
				},
			},
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
