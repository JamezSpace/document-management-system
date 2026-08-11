import type { ActorContext } from "../../../security/application/type/authorization.type.js";
import type {
	AuditEventFilters,
	AuditEventRepositoryPort,
	AuditVisibility,
} from "../ports/AuditEventRepository.port.js";

type ListAuditEventInput = Omit<AuditEventFilters, "limit" | "before"> & {
	limit?: number;
	before?: string;
};

class ListAuditEventsUseCase {
	constructor(private readonly repository: AuditEventRepositoryPort) {}

	async execute(actor: ActorContext, input: ListAuditEventInput) {
		const visibility = this.resolveVisibility(actor);
		const limit = Math.min(Math.max(input.limit ?? 50, 1), 100);
		const before = input.before ? new Date(input.before) : undefined;

		if (before && Number.isNaN(before.getTime())) {
			throw new TypeError("before must be a valid ISO date-time");
		}

		const filters: AuditEventFilters = {
			limit,
			...(input.actorId !== undefined ? { actorId: input.actorId } : {}),
			...(input.eventType !== undefined
				? { eventType: input.eventType }
				: {}),
			...(input.aggregateType !== undefined
				? { aggregateType: input.aggregateType }
				: {}),
			...(input.aggregateId !== undefined
				? { aggregateId: input.aggregateId }
				: {}),
			...(input.officeId !== undefined ? { officeId: input.officeId } : {}),
			...(input.unitId !== undefined ? { unitId: input.unitId } : {}),
			...(input.outcome !== undefined ? { outcome: input.outcome } : {}),
			...(before !== undefined ? { before } : {}),
		};

		return this.repository.list(visibility, filters);
	}

	private resolveVisibility(actor: ActorContext): AuditVisibility {
		const now = Date.now();
		const auditGrants = actor.grants.filter(
			(grant) =>
				grant.capability === "audit.event.view" &&
				grant.validFrom.getTime() <= now &&
				(grant.validTo === null || now < grant.validTo.getTime()),
		);

		return {
			organization: auditGrants.some(
				(grant) => grant.scope.type === "organization",
			),
			unitIds: [
				...new Set(
					auditGrants.flatMap((grant) =>
						grant.scope.type === "unit" ? [grant.scope.id] : [],
					),
				),
			],
			officeIds: [
				...new Set(
					auditGrants.flatMap((grant) =>
						grant.scope.type === "office" ? [grant.scope.id] : [],
					),
				),
			],
		};
	}
}

export default ListAuditEventsUseCase;
export type { ListAuditEventInput };
