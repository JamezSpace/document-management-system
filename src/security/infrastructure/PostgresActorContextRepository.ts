import type { PostgresDb } from "@fastify/postgres";
import type { ActorContextRepositoryPort } from "../application/ActorContextRepository.port.js";
import type {
	ActorGrant,
	ActorResolution,
	AuthorizationScope,
} from "../application/authorization.types.js";

interface ActorRow {
	identity_id: string;
	identity_status: string;
	staff_id: string | null;
	staff_status: string | null;
	office_id: string | null;
	unit_id: string | null;
	assignment_id: string | null;
	role_name: string | null;
	capability: string | null;
	scope_type: "organization" | "unit" | "office" | null;
	scope_unit_id: string | null;
	scope_office_id: string | null;
	valid_from: Date | null;
	valid_to: Date | null;
}

class PostgresActorContextRepository implements ActorContextRepositoryPort {
	constructor(private readonly dbPool: PostgresDb) {}

	async resolveByAuthProviderId(
		authProviderId: string,
	): Promise<ActorResolution | null> {
		const result = await this.dbPool.query<ActorRow>(
			`
				SELECT
					u.id AS identity_id,
					u.status AS identity_status,
					s.id AS staff_id,
					s.status AS staff_status,
					s.office_id,
					s.unit_id,
					ra.id AS assignment_id,
					r.name AS role_name,
					p.code AS capability,
					ra.scope_type,
					ra.scope_unit_id,
					ra.scope_office_id,
					ra.valid_from,
					ra.valid_to
				FROM identity.users u
				LEFT JOIN identity.staff s ON s.identity_id = u.id
				LEFT JOIN identity.role_assignments ra
					ON ra.staff_id = s.id
					AND ra.valid_from <= NOW()
					AND (ra.valid_to IS NULL OR NOW() < ra.valid_to)
					AND ra.revoked_at IS NULL
				LEFT JOIN identity.roles r ON r.id = ra.role_id
				LEFT JOIN identity.role_permissions rp ON rp.role_id = r.id
				LEFT JOIN identity.permissions p ON p.id = rp.permission_id
				WHERE u.auth_provider_id = $1;
			`,
			[authProviderId],
		);

		if (result.rows.length === 0) return null;

		const first = result.rows[0]!;
		const grants = result.rows.flatMap((row): ActorGrant[] => {
			if (
				!row.assignment_id ||
				!row.role_name ||
				!row.capability ||
				!row.scope_type ||
				!row.valid_from
			) {
				return [];
			}

			return [
				{
					assignmentId: row.assignment_id,
					role: row.role_name,
					capability: row.capability,
					scope: this.toScope(row),
					validFrom: row.valid_from,
					validTo: row.valid_to,
				},
			];
		});

		return {
			identityId: first.identity_id,
			identityStatus: first.identity_status,
			staff: first.staff_id
				? {
						id: first.staff_id,
						status: first.staff_status ?? "unknown",
						officeId: first.office_id,
						unitId: first.unit_id,
					}
				: null,
			grants,
		};
	}

	private toScope(row: ActorRow): AuthorizationScope {
		switch (row.scope_type) {
			case "unit":
				return { type: "unit", id: row.scope_unit_id! };
			case "office":
				return { type: "office", id: row.scope_office_id! };
			default:
				return { type: "organization", id: null };
		}
	}
}

export default PostgresActorContextRepository;
