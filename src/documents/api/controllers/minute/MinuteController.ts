import type CreateMinuteUseCase from "../../../application/usecases/minute/CreateMinute.usecase.js";
import type GetMinuteByIdUseCase from "../../../application/usecases/minute/GetMinuteById.usecase.js";
import type GetMinutesByDocumentIdUseCase from "../../../application/usecases/minute/GetMinutesByDocumentId.usecase.js";
import type { MinuteSchemaForCreationType } from "../../types/minute.type.js";

class MinuteController {
	constructor(
		private readonly createMinuteUseCase: CreateMinuteUseCase,
		private readonly getMinuteByIdUseCase: GetMinuteByIdUseCase,
		private readonly getMinutesByDocumentIdUseCase: GetMinutesByDocumentIdUseCase,
	) {}

	async createMinute(
		documentId: string,
		authorStaffId: string,
		payload: MinuteSchemaForCreationType,
	) {
		return this.createMinuteUseCase.execute({
			documentId,
			authorStaffId,
			action: payload.action,
			content: payload.content,
			inboxEntryId: payload.inboxEntryId ?? null,
			parentMinuteId: payload.parentMinuteId ?? null,
		});
	}

	async fetchMinuteById(minuteId: string) {
		return this.getMinuteByIdUseCase.execute(minuteId);
	}

	async fetchMinutesByDocumentId(documentId: string) {
		return this.getMinutesByDocumentIdUseCase.execute(documentId);
	}
}

export default MinuteController;
