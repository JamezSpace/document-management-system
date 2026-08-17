import type { IdGeneratorPort } from "../../../../shared/application/port/services/IdGenerator.port.js";
import type { TransactionManager } from "../../../../shared/application/port/TransactionManager.port.js";
import { AccessDomainErrors } from "../../../../shared/errors/enum/domain.enum.js";
import AccessDomainError from "../../domain/errors/AccessDomainError.js";
import RoleAssignment, {
	RoleAssignmentSource,
} from "../../domain/RoleAssignment.js";
import type { AccessEventsPort } from "../ports/AccessEvents.port.js";
import type { RoleAssignmentRepositoryPort } from "../ports/RoleAssignmentsRepository.port.js";

class DelegateRole {
	constructor(
		private readonly authorityEvents: AccessEventsPort,
		private readonly roleAssignmentRepo: RoleAssignmentRepositoryPort,
		private readonly idGenerator: IdGeneratorPort,
		private readonly transactionManager: TransactionManager,
	) {}

	async delegateRole(payload: {
		sourceAssignmentId: string;
		staffId: string;
		delegatedBy: string;
		validFrom?: Date;
		validTo: Date;
	}): Promise<RoleAssignment> {
		const assignment = await this.transactionManager.execute(async (tx) => {
			const source = await this.roleAssignmentRepo.findById(
				payload.sourceAssignmentId,
				tx,
				{ forUpdate: true },
			);
			const validFrom = payload.validFrom ?? new Date();

			if (
				!source ||
				source.staffId !== payload.delegatedBy ||
				!source.isActive(validFrom)
			) {
				throw new AccessDomainError(AccessDomainErrors.ROLE_NOT_ACTIVE);
			}

			const sourceValidTo = source.getValidTo();
			if (sourceValidTo && payload.validTo > sourceValidTo) {
				throw new AccessDomainError(
					AccessDomainErrors.INVALID_ROLE_ASSIGNMENT_VALIDITY,
					"A delegation cannot outlive its source assignment",
				);
			}

			const delegated = new RoleAssignment({
				id: `ROLE-ASSIGN-${this.idGenerator.generate()}`,
				staffId: payload.staffId,
				role: source.role,
				scope: source.scope,
				source: RoleAssignmentSource.DELEGATED,
				validFrom,
				validTo: payload.validTo,
				assignedBy: payload.delegatedBy,
				delegatedBy: payload.delegatedBy,
			});

			await this.roleAssignmentRepo.insert(delegated, tx);
			return delegated;
		});

		await this.authorityEvents.roleDelegated({
			staffId: assignment.staffId,
			role: assignment.role,
			delegatedBy: payload.delegatedBy,
			validTo: payload.validTo,
		});

		return assignment;
	}
}

export default DelegateRole;
