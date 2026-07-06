import DomainError from "../../shared/errors/DomainError.error.js";
import { GlobalDomainErrors } from "../../shared/errors/enum/domain.enum.js";
import { LifecycleActions } from "./enum/lifecycleActions.enum.js";
import { LifecycleState } from "./enum/lifecycleState.enum.js";

/**
 * This class contains methods that states business rules for document state transitions. This enforces state transition rules highlighted in the "state machine". Refer to the "state machine" for more info.
 */
class DocumentTransitions {
	private static allowedTransitions = {
		[LifecycleState.DRAFT]: [null, LifecycleState.IN_REVIEW], // null for CREATE helps to distinguish between items that were either rejected or cancelled
		[LifecycleState.IN_REVIEW]: [LifecycleState.DRAFT],
		[LifecycleState.ACTIVE]: [
			LifecycleState.IN_REVIEW, // external facing documents
			LifecycleState.DRAFT, // internal facing documents
		],
		[LifecycleState.DECLARED_RECORD]: [
			LifecycleState.ACTIVE,
		],
		[LifecycleState.ARCHIVED]: [
			LifecycleState.ACTIVE,
			LifecycleState.DECLARED_RECORD,
		],
		[LifecycleState.DISPOSED]: [
			LifecycleState.DECLARED_RECORD,
			LifecycleState.ARCHIVED,
		],
		[LifecycleState.CANCELLED]: [
			LifecycleState.DRAFT,
			LifecycleState.IN_REVIEW,
		],
	};

	static transition(
		prevState: LifecycleState | null,
		newState: LifecycleState,
	) {
		const validSources = this.allowedTransitions[
			newState
		] as (LifecycleState | null)[];

		if (!validSources || !validSources.includes(prevState)) {
			throw new DomainError(
				GlobalDomainErrors.document.INVALID_DOCUMENT_STATE_TRANSITION,
				{
					currentState: prevState,
					targetState: newState,
				},
			);
		}

		switch (newState) {
			case LifecycleState.IN_REVIEW:
				this.assertCanSubmit(prevState!);
				break;
			case LifecycleState.ACTIVE:
				this.assertCanActivate(prevState!);
				break;
			case LifecycleState.DECLARED_RECORD:
				this.assertCanDeclareRecord(prevState!);
				break;
			case LifecycleState.ARCHIVED:
				this.assertCanArchive(prevState!);
				break;
			case LifecycleState.DISPOSED:
				this.assertCanDispose(prevState!);
				break;
			case LifecycleState.CANCELLED:
				this.assertCanDelete(prevState!);
				break;
		}
	}

	private static assertCanCreate(currentState: LifecycleState) {
		// Logically, a document is DRAFT once created
		if (currentState !== LifecycleState.DRAFT)
			throw new DomainError(
				GlobalDomainErrors.document.INVALID_DOCUMENT_STATE_TRANSITION,
				{
					currentState,
					targetState: LifecycleState.DRAFT,
					details: { action: LifecycleActions.CREATE },
				},
			);
	}

	static assertCanSubmit(currentState: LifecycleState) {
		if (currentState !== LifecycleState.DRAFT)
			throw new DomainError(
				GlobalDomainErrors.document.INVALID_DOCUMENT_STATE_TRANSITION,
				{
					currentState,
					targetState: LifecycleState.IN_REVIEW, // Fixed
					details: { action: LifecycleActions.SUBMIT },
				},
			);
	}

	static assertCanDelete(currentState: LifecycleState) {
		// Soft delete logic
		if (
			![LifecycleState.DRAFT, LifecycleState.IN_REVIEW].includes(
				currentState,
			)
		)
			throw new DomainError(
				GlobalDomainErrors.document.INVALID_DOCUMENT_STATE_TRANSITION,
				{
					currentState,
					targetState: LifecycleState.CANCELLED, // Fixed
					details: { action: LifecycleActions.DELETE },
				},
			);
	}

	static assertCanActivate(currentState: LifecycleState) {
		// allows activation if it's currently DRAFT (internal fast-track)
		if (
			![LifecycleState.IN_REVIEW, LifecycleState.DRAFT].includes(
				currentState,
			)
		) {
			throw new DomainError(
				GlobalDomainErrors.document.INVALID_DOCUMENT_STATE_TRANSITION,
				{
					currentState,
					targetState: LifecycleState.ACTIVE,
					details: { action: LifecycleActions.ACTIVATE },
				},
			);
		}
	}

	static assertCanDeclareRecord(currentState: LifecycleState) {
		if (currentState !== LifecycleState.ACTIVE)
			throw new DomainError(
				GlobalDomainErrors.document.INVALID_DOCUMENT_STATE_TRANSITION,
				{
					currentState,
					targetState: LifecycleState.DECLARED_RECORD,
					details: { action: LifecycleActions.DECLARE_RECORD },
				},
			);
	}

	static assertCanArchive(currentState: LifecycleState) {
		if (
			![
				LifecycleState.ACTIVE,
				LifecycleState.DECLARED_RECORD,
			].includes(currentState)
		)
			throw new DomainError(
				GlobalDomainErrors.document.INVALID_DOCUMENT_STATE_TRANSITION,
				{
					currentState,
					targetState: LifecycleState.ARCHIVED,
					details: { action: LifecycleActions.ARCHIVE },
				},
			);
	}

	static assertCanDispose(currentState: LifecycleState) {
		if (
			![LifecycleState.ARCHIVED, LifecycleState.DECLARED_RECORD].includes(
				currentState,
			)
		)
			throw new DomainError(
				GlobalDomainErrors.document.INVALID_DOCUMENT_STATE_TRANSITION,
				{
					currentState,
					targetState: LifecycleState.DISPOSED,
					details: { action: LifecycleActions.DISPOSE },
				},
			);
	}
}

export default DocumentTransitions;
