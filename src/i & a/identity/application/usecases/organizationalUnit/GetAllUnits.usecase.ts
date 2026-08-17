import type OrganizationalUnit from "../../../domain/entities/unit/OrganizationalUnit.js";
import type { OrgUnitRepositoryPort } from "../../ports/repos/entities/unit/OrgUnitRepository.port.js";


class GetAllUnitsUseCase {
	constructor(private readonly unitRepo: OrgUnitRepositoryPort) {}

	buildTree(units: OrganizationalUnit[]) {
		const map = new Map<string, any>();
		const roots: any[] = [];

		// First pass: initialize nodes
		for (const unit of units) {
			map.set(unit.id, { ...unit, subunits: [] });
		}

		// Second pass: assign children
		for (const unit of units) {
            console.log("unit", unit);
            console.log("parent id", unit.parentId);
            
			if (unit.parentId) {
				const parent = map.get(unit.parentId);
				if (parent) {
					parent.subunits.push(map.get(unit.id));
				}
			} else {
				roots.push(map.get(unit.id));
			}
		}

		return roots;
	}

	async getAllUnits() {
		const allUnits = await this.unitRepo.fetchAllUnits();

		return this.buildTree(allUnits);
	}
}

export default GetAllUnitsUseCase;
