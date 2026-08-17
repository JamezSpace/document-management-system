import type { DispatchStarterPort } from "../../../shared/application/port/DispatchStarter.port.js";
import type SendCorrespondenceUseCase from "../../application/usecases/SendCorrespondence.usecase.js";

class DispatchStarterAdapter implements DispatchStarterPort {
	constructor(
		private readonly sendCorrespondenceUseCase: SendCorrespondenceUseCase,
	) {}

	async startDispatch(payload: {
		documentId: string;
		activatedBy: string;
	}): Promise<void> {
		await this.sendCorrespondenceUseCase.execute({
			docId: payload.documentId,
			actorId: payload.activatedBy,
		});
	}
}

export default DispatchStarterAdapter;
