import type { OfficeRepositoryPort } from "../../ports/repos/entities/office/OfficeRepository.port.js";

class GetAllOfficesUseCase {
    constructor(private readonly officeRepo: OfficeRepositoryPort) {}

    async getAllOffices() {
        const allOffices = await this.officeRepo.fetchAllOffices();

        return allOffices;
    }

    async getAllOfficesByUnit(unitId: string) {
        const allOffices = await this.officeRepo.findOfficesByUnitId(unitId);

        return allOffices;
    }


}

export default GetAllOfficesUseCase;