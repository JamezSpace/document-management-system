import { GlobalEventTypes } from "../../../shared/application/enum/event.enum.js";
import type { EventBusPort } from "../../../shared/application/port/services/eventbus.port.js";
import type { DocumentEventsPort } from "../../application/ports/events/DocumentEvents.port.js";

class DocumentEventsAdapter implements DocumentEventsPort {
	constructor(private readonly eventBus: EventBusPort) {}

	async documentInitialized(payload: {
		documentId: string;
		createdBy: string;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.document.document.DOCUMENT_INITIALIZED,
			occurredAt: new Date(),
			payload,
		});
	}
	
    async documentVersionCreated(payload: {
		documentId: string;
		versionedBy: string;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.document.document.DOCUMENT_VERSION_CREATED,
			occurredAt: new Date(),
			payload,
		});
	}
	
    async documentVersionChanged(payload: {
		documentId: string;
		actorBy: string;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.document.document.DOCUMENT_VERSION_CHANGED,
			occurredAt: new Date(),
			payload,
		});
	}

	async documentCancelled(payload: {
		documentId: string;
		cancelledBy: string;
		reason: string;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.document.document.DOCUMENT_CANCELLED,
			occurredAt: new Date(),
			payload,
		});
	}

	async documentActivated(payload: {
		documentId: string;
		activatedBy: string;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.document.document.DOCUMENT_ACTIVATED,
			occurredAt: new Date(),
			payload,
		});
	}

	async documentDeclared(payload: {
		documentId: string;
		declaredBy: string;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.document.document.DOCUMENT_DECLARED,
			occurredAt: new Date(),
			payload,
		});
	}

	async documentDeleted(payload: {
		documentId: string;
		deletedBy: string;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.document.document.DOCUMENT_DELETED,
			occurredAt: new Date(),
			payload,
		});
	}

	async documentDisposed(payload: {
		documentId: string;
		disposedBy: string;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.document.document.DOCUMENT_DISPOSED,
			occurredAt: new Date(),
			payload,
		});
	}

	async documentSubmitted(payload: {
		documentId: string;
		submittedBy: string;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.document.document.DOCUMENT_SUBMITTED,
			occurredAt: new Date(),
			payload,
		});
	}

	async documentCreated(payload: {
		documentId: string;
		createdBy: string;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.document.document.DOCUMENT_CREATED,
			occurredAt: new Date(),
			payload,
		});
	}

	async documentArchived(payload: {
		documentId: string;
		archivedBy: string;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.document.document.DOCUMENT_ARCHIVED,
			occurredAt: new Date(),
			payload,
		});
	}

	async documentMediaAttached(payload: {
		documentId: string;
		mediaId: string;
		attachedBy: string;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.document.document.DOCUMENT_MEDIA_ATTACHED,
			occurredAt: new Date(),
			payload,
		});
	}

	async documentMediaReplaced(payload: {
		documentId: string;
		oldMediaId: string;
		newMediaId: string;
		replacedBy: string;
	}): Promise<void> {
		await this.eventBus.emit({
			eventName: GlobalEventTypes.document.document.DOCUMENT_MEDIA_REPLACED,
			occurredAt: new Date(),
			payload,
		});
	}
}

export default DocumentEventsAdapter;
