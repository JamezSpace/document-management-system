import type { DesignationRepositoryPort } from "../../ports/repos/entities/designation/DesignationRepository.port.js";


class GetAllDesignationUseCase {
    constructor(private readonly designationRepo: DesignationRepositoryPort) {}

    async fetchAll() {
        const allDesignations = await this.designationRepo.fetchAll();

        return allDesignations;
    }

    async fetchAllByOffice(officeId: string) {
        const officeDesignations = await this.designationRepo.fetchAllDesignationsWithinAnOffice(officeId)

        return officeDesignations;
    }
}

export default GetAllDesignationUseCase;