import type AddNewOrgUnitUseCase from "../../../application/usecases/organizationalUnit/AddNewOrgUnit.usecase.js";
import type GetAllUnitsUseCase from "../../../application/usecases/organizationalUnit/GetAllUnits.usecase.js";
import type { CreateOrgUnitType } from "../../types/unit/orgUnit.type.js";

class OrgUnitController {
    
    // inject use cases here
    constructor(private readonly addOrgUnitUseCase: AddNewOrgUnitUseCase, private readonly getAllUnitsUseCase: GetAllUnitsUseCase){}

    async addNewUnit(payload: CreateOrgUnitType) {
        const newUnit = await this.addOrgUnitUseCase.addNewOrgUnit(payload);

        return newUnit;
    }

    async getAllUnits() {
        const allUnits = this.getAllUnitsUseCase.getAllUnits()

        return allUnits;
    }
}

export default OrgUnitController;