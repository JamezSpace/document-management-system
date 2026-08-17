import type RoleAssignment from "../../domain/RoleAssignment.js";
import type { RoleAssignmentRepositoryPort } from "../ports/RoleAssignmentsRepository.port.js";

class ListRoleAssignmentsUseCase {
	constructor(
		private readonly roleAssignmentRepository: RoleAssignmentRepositoryPort,
	) {}

	async execute(staffId: string): Promise<RoleAssignment[]> {
		return this.roleAssignmentRepository.findByStaffId(staffId);
	}
}

export default ListRoleAssignmentsUseCase;
