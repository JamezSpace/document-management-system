import type { IdGeneratorPort } from "../../../../../shared/application/port/services/IdGenerator.port.js";
import Office from "../../../domain/entities/office/Office.js";
import type { OfficeEventsPort } from "../../ports/events/office/OfficeEvents.port.js";
import type { OfficeRepositoryPort } from "../../ports/repos/entities/office/OfficeRepository.port.js";
import type { OfficeTypeForCreation } from "../../types/office/office.type.js";

class AddNewOfficeUseCase {
	constructor(
		private readonly idGenerator: IdGeneratorPort,
		private readonly officeEvents: OfficeEventsPort,
		private readonly officeRepo: OfficeRepositoryPort,
	) {}

	async addNewOffice(payload: OfficeTypeForCreation) {
		const uuid = this.idGenerator.generate();
		const officeId = "OFFICE-" + uuid;

		// create an office
		const office = new Office({
			id: officeId,
			name: payload.name,
			unitId: payload.unitId,
		});

		const newOffice = await this.officeRepo.save(office)

		if (newOffice)
			await this.officeEvents.officeCreated({
				officeId: newOffice.getOfficeId(),
			});

		return newOffice;
	}
}

export default AddNewOfficeUseCase;
