import type { IdGeneratorPort } from "../../../../shared/application/port/services/IdGenerator.port.js";
import ApplicationError from "../../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../../shared/errors/enum/application.enum.js";
import type { MinuteAction } from "../../../domain/enum/MinuteAction.enum.js";
import Minute from "../../../domain/entities/minute/Minute.js";
import type { DocumentRepositoryPort } from "../../ports/repos/DocumentRepository.port.js";
import type { MinuteRepositoryPort } from "../../ports/repos/MinuteRepository.port.js";

interface CreateMinutePayload {
	documentId: string;
	authorStaffId: string;
	action: MinuteAction;
	content: string | null;
	inboxEntryId?: string | null;
	parentMinuteId?: string | null;
}

class CreateMinuteUseCase {
	constructor(
		private readonly idGenerator: IdGeneratorPort,
		private readonly documentRepo: DocumentRepositoryPort,
		private readonly minuteRepo: MinuteRepositoryPort,
	) {}

	async execute(payload: CreateMinutePayload) {
		const document = await this.documentRepo.findDocumentById(
			payload.documentId,
		);

		if (!document) {
			throw new ApplicationError(ApplicationErrorEnum.DOCUMENT_NOT_FOUND, {
				message: `Document with id ${payload.documentId} doesn't exist`,
			});
		}

		if (payload.parentMinuteId) {
			const parentMinute = await this.minuteRepo.findById(payload.parentMinuteId);

			if (!parentMinute) {
				throw new ApplicationError(ApplicationErrorEnum.MINUTE_NOT_FOUND, {
					message: `Parent minute with id ${payload.parentMinuteId} doesn't exist`,
				});
			}

			if (parentMinute.documentId !== payload.documentId) {
				throw new ApplicationError(ApplicationErrorEnum.NOT_ALLOWED, {
					message: "Parent minute must belong to the same document",
				});
			}
		}
        
		const minute = new Minute({
			id: "DOC-MIN-" + this.idGenerator.generate(),
			documentId: payload.documentId,
			authorStaffId: payload.authorStaffId,
			action: payload.action,
			content: payload.content,
			inboxEntryId: payload.inboxEntryId ?? null,
			parentMinuteId: payload.parentMinuteId ?? null,
		});

		return this.minuteRepo.save(minute);
	}
}

export default CreateMinuteUseCase;
