import type { TransactionManager } from "../../../../shared/application/port/TransactionManager.port.js";
import { AccessDomainErrors } from "../../../../shared/errors/enum/domain.enum.js";
import AccessDomainError from "../../domain/errors/AccessDomainError.js";
import type RoleAssignment from "../../domain/RoleAssignment.js";
import type { AccessEventsPort } from "../ports/AccessEvents.port.js";
import type { RoleAssignmentRepositoryPort } from "../ports/RoleAssignmentsRepository.port.js";

class RevokeRole {
	constructor(
		private readonly authorityEvents: AccessEventsPort,
		private readonly roleAssignmentRepo: RoleAssignmentRepositoryPort,
		private readonly transactionManager: TransactionManager,
	) {}

	async revokeRole(payload: {
		assignmentId: string;
		revokedBy: string;
		revokedAt?: Date;
	}): Promise<RoleAssignment> {
		const assignment = await this.transactionManager.execute(async (tx) => {
			const existing = await this.roleAssignmentRepo.findById(
				payload.assignmentId,
				tx,
				{ forUpdate: true },
			);

			if (!existing) {
				throw new AccessDomainError(AccessDomainErrors.ROLE_NOT_ACTIVE);
			}

			existing.revoke(payload.revokedBy, payload.revokedAt ?? new Date());
			await this.roleAssignmentRepo.revoke(existing, tx);
			return existing;
		});

		await this.authorityEvents.roleRevoked({
			staffId: assignment.staffId,
			role: assignment.role,
			revokedBy: payload.revokedBy,
		});

		return assignment;
	}
}

export default RevokeRole;
