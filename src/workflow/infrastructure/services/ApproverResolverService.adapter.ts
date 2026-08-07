import type { WorkflowAccessPort } from "../../../shared/application/port/intersubsystem/WorkflowAccess.port.js";
import type { DocumentView } from "../../../shared/application/port/intersubsystem/WorkflowDocument.port.js";
import type { ApproverResolverServicePort } from "../../application/port/services/ApproverResolverServicePort.js";
import { ResolutionStrategy } from "../../domain/enum/ResolutionStrategy.enum.js";

class ApproverResolverServiceAdapter implements ApproverResolverServicePort {
	constructor(
		private readonly workflowAccessRepo: WorkflowAccessPort,
	) {}

	async resolve(
		document: DocumentView,
		role: string,
		strategy: ResolutionStrategy,
	): Promise<string[]> {
		switch (strategy) {
			case ResolutionStrategy.DIRECT_SUPERVISOR:
				return this.resolveSupervisor(document.owner.id);

			case ResolutionStrategy.ROLE_IN_UNIT: {
				const { unitId } = document.owner;
				return unitId ? this.resolveRoleInUnit(role, unitId) : [];
			}

			case ResolutionStrategy.ROLE_IN_OFFICE: {
				const { officeId } = document.owner;
				return officeId ? this.resolveRoleInOffice(role, officeId) : [];
			}

			default:
				throw new Error("Unsupported resolution strategy");
		}
	}

	// direct supervisor
	private async resolveSupervisor(staffId: string): Promise<string[]> {
		// staff reporting table (delegation + primary)
		const supervisor =
			await this.workflowAccessRepo.findActiveSupervisor(staffId);

		if (supervisor) {
			return [supervisor.supervisorId];
		}

		// fallback to finding supervisor by hierarchy
		const fallback =
			await this.workflowAccessRepo.findByHierarchy(staffId);

		if (fallback) {
			return [fallback.supervisorId];
		}

		return [];
	}

	// role in unit
	private async resolveRoleInUnit(
		role: string,
		unitId: string,
	): Promise<string[]> {
		return this.workflowAccessRepo.findByRoleAndScope(role, {
			unitId,
		});
	}

	// role in office
	private async resolveRoleInOffice(
		role: string,
		officeId: string,
	): Promise<string[]> {
		return this.workflowAccessRepo.findByRoleAndScope(role, {
			officeId,
		});
	}
}

export default ApproverResolverServiceAdapter;
