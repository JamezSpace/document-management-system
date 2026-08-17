import type CreateDocumentRetentionPolicyUsecase from "../../application/usecases/CreateDocumentRetentionPolicy.usecase.js";
import type { CreateDocumentRetentionPolicyType } from "../types/docRetPolicy.type.js";

class DocumentRetentionPolicyController {
	constructor(
		private readonly createDocumentRetentionPolicyUseCase: CreateDocumentRetentionPolicyUsecase,
	) {}

	async createDocumentRetentionPolicy(
		actorId: string,
		payload: CreateDocumentRetentionPolicyType,
	) {
        const {effectiveFrom, ...restOfPayload} = payload;

		const newPolicy =
			await this.createDocumentRetentionPolicyUseCase.createDocumentRetentionPolicy(
				actorId,
				{
					effectiveFrom: new Date(payload.effectiveFrom),
					...restOfPayload,
				},
			);

		return newPolicy;
	}
}

export default DocumentRetentionPolicyController;
