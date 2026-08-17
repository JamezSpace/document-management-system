import DomainError from "../../shared/errors/DomainError.error.js";
import { GlobalDomainErrors } from "../../shared/errors/enum/domain.enum.js";
import WorkflowState from "./enum/WorkflowState.enum.js";

/**
 * This class contains methods that states business rules for a workflow instance. This enforces state transition rules highlighted in the "state machine". Refer to the "state machine" for more info.
 */
class WorkflowTransition {
	static assertCanActivate(currentState: WorkflowState) {
		if (
			![
				WorkflowState.NOT_STARTED,
				WorkflowState.WAITING,
				WorkflowState.ADVANCED,
				WorkflowState.STALLED,
			].includes(currentState)
		)
			throw new DomainError(GlobalDomainErrors.workflow.INVALID_WORKFLOW_STATE, {
				currentState,
				targetState: WorkflowState.ACTIVE,
			});
	}

	static assertCanWait(currentState: WorkflowState) {
		if (currentState !== WorkflowState.ACTIVE)
			throw new DomainError(GlobalDomainErrors.workflow.INVALID_WORKFLOW_STATE, {
				currentState,
				targetState: WorkflowState.WAITING,
			});
	}

	static assertCanAdvance(currentState: WorkflowState) {
		if (currentState !== WorkflowState.WAITING)
			throw new DomainError(GlobalDomainErrors.workflow.INVALID_WORKFLOW_STATE, {
				currentState,
				targetState: WorkflowState.ADVANCED,
			});
	}

	static assertCanComplete(currentState: WorkflowState) {
		if (currentState !== WorkflowState.ACTIVE)
			throw new DomainError(GlobalDomainErrors.workflow.INVALID_WORKFLOW_STATE, {
				currentState,
				targetState: WorkflowState.COMPLETED,
			});
	}

	static assertCanStall(currentState: WorkflowState) {
		if (currentState !== WorkflowState.ACTIVE)
			throw new DomainError(GlobalDomainErrors.workflow.INVALID_WORKFLOW_STATE, {
				currentState,
				targetState: WorkflowState.STALLED,
			});
	}
}

export default WorkflowTransition;
