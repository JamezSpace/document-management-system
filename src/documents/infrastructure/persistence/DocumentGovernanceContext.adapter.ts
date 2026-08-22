import type { PostgresDb } from "@fastify/postgres";
import type {
	DocumentGovernanceContextPort,
	ResolvedDocumentGovernanceContext,
} from "../../../shared/application/port/intersubsystem/DocumentGovernanceContext.port.js";
import type { GovernanceActorRelationship } from "../../../shared/application/port/intersubsystem/DocumentGovernancePolicy.port.js";

interface GovernanceContextRow {
	is_authenticated_internal_staff: boolean;
	is_author: boolean;
	is_named_individual: boolean;
	is_target_handler: boolean;
	is_authorized_custodian: boolean;
	is_unit_head: boolean;
	is_delegated_unit_head: boolean;
	is_primary_authorizing_desk: boolean;
	has_required_clearance: boolean;
	has_effective_unit_head_signature: boolean;
	has_active_guest_reader_grant: boolean;
	guest_reader_grant_status: "active" | "expired" | "revoked" | null;
	export_grant_active: boolean;
	export_grant_granted_by: "originator" | "unit_head" | null;
	export_grant_valid_to: Date | null;
	export_grant_remaining_uses: number | null;
}

class DocumentGovernanceContextAdapter
	implements DocumentGovernanceContextPort
{
	constructor(private readonly dbPool: PostgresDb) {}

	async hasRestrictedClearance(actorStaffId: string): Promise<boolean> {
		const result = await this.dbPool.query(
			`SELECT 1
			 FROM identity.role_assignments ra
			 JOIN identity.role_permissions rp ON rp.role_id = ra.role_id
			 JOIN identity.permissions permission ON permission.id = rp.permission_id
			 WHERE ra.staff_id = $1
				AND ra.valid_from <= NOW()
				AND (ra.valid_to IS NULL OR NOW() < ra.valid_to)
				AND ra.revoked_at IS NULL
				AND permission.code = 'document.restricted.view'
			 LIMIT 1;`,
			[actorStaffId],
		);
		return result.rows.length > 0;
	}

	async resolve(
		documentId: string,
		actorStaffId: string,
	): Promise<ResolvedDocumentGovernanceContext> {
		const result = await this.dbPool.query<GovernanceContextRow>(
			`
				SELECT
					EXISTS (
						SELECT 1 FROM identity.staff s
						WHERE s.id = $2 AND s.status = 'active'
					) AS is_authenticated_internal_staff,
					EXISTS (
						SELECT 1 FROM document.documents d
						WHERE d.id = $1 AND d.owner_id = $2
					) AS is_author,
					EXISTS (
						SELECT 1 FROM document.documents d
						WHERE d.id = $1 AND d.owner_id = $2
					) AS is_named_individual,
					EXISTS (
						SELECT 1
						FROM document.document_addressee da
						JOIN identity.staff s ON s.id = $2
						WHERE da.document_id = $1
							AND da.recipient_unit_id = s.unit_id
							AND da.addressed_to_designation_id = s.designation_id
					) AS is_target_handler,
					EXISTS (
						SELECT 1
						FROM dispatch.inbox_entries ie
						JOIN identity.staff current_staff ON current_staff.id = $2
						WHERE ie.document_id = $1
							AND ie.staff_id = $2
							AND current_staff.status = 'active'
							AND ie.unit_id = current_staff.unit_id
							AND (
								ie.designation_id IS NULL
								OR ie.designation_id = current_staff.designation_id
							)
					) AS is_authorized_custodian,
					EXISTS (
						SELECT 1
						FROM document.documents d
						JOIN identity.staff s ON s.id = $2 AND s.unit_id = d.originating_unit_id
						JOIN identity.designation_capability_defaults dcd
							ON dcd.designation_id = s.designation_id
						JOIN identity.capability_classes cc
							ON cc.id = dcd.capability_class_id
						WHERE d.id = $1 AND cc.name = 'unit head' AND cc.category = 'leadership'
							AND NOT EXISTS (
								SELECT 1
								FROM identity.role_assignments delegated
								JOIN identity.capability_role_mappings delegated_mapping
									ON delegated_mapping.role_id = delegated.role_id
								JOIN identity.capability_classes delegated_class
									ON delegated_class.id = delegated_mapping.capability_class_id
								WHERE delegated.source = 'delegated'
									AND delegated.scope_type = 'unit'
									AND delegated.scope_unit_id = d.originating_unit_id
									AND delegated.valid_from <= NOW()
									AND (delegated.valid_to IS NULL OR NOW() < delegated.valid_to)
									AND delegated.revoked_at IS NULL
									AND delegated_class.name = 'unit head'
									AND delegated_class.category = 'leadership'
							)
					) AS is_unit_head,
					EXISTS (
						SELECT 1
						FROM document.documents d
						JOIN identity.role_assignments ra
							ON ra.staff_id = $2
							AND ra.source = 'delegated'
							AND ra.valid_from <= NOW()
							AND (ra.valid_to IS NULL OR NOW() < ra.valid_to)
							AND ra.revoked_at IS NULL
							AND ra.scope_type = 'unit'
							AND ra.scope_unit_id = d.originating_unit_id
						JOIN identity.capability_role_mappings crm ON crm.role_id = ra.role_id
						JOIN identity.capability_classes cc ON cc.id = crm.capability_class_id
						WHERE d.id = $1 AND cc.name = 'unit head' AND cc.category = 'leadership'
					) AS is_delegated_unit_head,
					EXISTS (
						SELECT 1
						FROM document.document_addressee da
						JOIN identity.staff s ON s.id = $2
						WHERE da.document_id = $1 AND da.is_primary = TRUE
							AND da.recipient_unit_id = s.unit_id
							AND da.addressed_to_designation_id = s.designation_id
					) AS is_primary_authorizing_desk,
					EXISTS (
						SELECT 1
						FROM identity.role_assignments ra
						JOIN identity.role_permissions rp ON rp.role_id = ra.role_id
						JOIN identity.permissions permission ON permission.id = rp.permission_id
						WHERE ra.staff_id = $2
							AND ra.valid_from <= NOW()
							AND (ra.valid_to IS NULL OR NOW() < ra.valid_to)
							AND ra.revoked_at IS NULL
							AND permission.code = 'document.restricted.view'
					) AS has_required_clearance,
					EXISTS (
						SELECT 1 FROM document.document_unit_head_signatures signature
						WHERE signature.document_id = $1 AND signature.revoked_at IS NULL
					) AS has_effective_unit_head_signature,
					COALESCE(guest_reader_grant.status = 'active', FALSE) AS has_active_guest_reader_grant,
					guest_reader_grant.status AS guest_reader_grant_status,
					COALESCE(export_grant.active, FALSE) AS export_grant_active,
					export_grant.grantor_authority AS export_grant_granted_by,
					export_grant.valid_to AS export_grant_valid_to,
					export_grant.remaining_uses AS export_grant_remaining_uses
				FROM (VALUES (1)) AS base(dummy)
				LEFT JOIN LATERAL (
					SELECT CASE
						WHEN grant_record.revoked_at IS NOT NULL THEN 'revoked'
						WHEN grant_record.valid_to IS NOT NULL AND grant_record.valid_to <= NOW() THEN 'expired'
						ELSE 'active'
					END AS status
					FROM policy.document_governance_grants grant_record
					WHERE grant_record.document_id = $1
						AND grant_record.grantee_staff_id = $2
						AND grant_record.grant_type = 'guest_reader'
						AND grant_record.valid_from <= NOW()
					ORDER BY grant_record.created_at DESC
					LIMIT 1
				) guest_reader_grant ON TRUE
				LEFT JOIN LATERAL (
					SELECT TRUE AS active, grant_record.grantor_authority,
						grant_record.valid_to, grant_record.remaining_uses
					FROM policy.document_governance_grants grant_record
					WHERE grant_record.document_id = $1
						AND grant_record.grantee_staff_id = $2
						AND grant_record.grant_type = 'export'
						AND grant_record.revoked_at IS NULL
						AND grant_record.valid_from <= NOW()
						AND (grant_record.valid_to IS NULL OR NOW() < grant_record.valid_to)
						AND (grant_record.remaining_uses IS NULL OR grant_record.remaining_uses > 0)
					ORDER BY grant_record.valid_to NULLS LAST
					LIMIT 1
				) export_grant ON TRUE;
			`,
			[documentId, actorStaffId],
		);

		const row = result.rows[0]!;
		const relationships: GovernanceActorRelationship[] = [];
		if (row.is_author) relationships.push("author");
		if (row.is_named_individual) relationships.push("named_individual");
		if (row.is_target_handler) relationships.push("target_handler");
		if (row.is_authorized_custodian) relationships.push("authorized_custodian");
		if (row.is_unit_head) relationships.push("unit_head");
		if (row.is_delegated_unit_head) relationships.push("delegated_unit_head");
		if (row.is_primary_authorizing_desk)
			relationships.push("primary_authorizing_desk");
		if (row.has_active_guest_reader_grant) relationships.push("guest_reader");

		return {
			relationships,
			isAuthenticatedInternalStaff: row.is_authenticated_internal_staff,
			hasRequiredClearance: row.has_required_clearance,
			hasActiveGuestReaderGrant: row.has_active_guest_reader_grant,
			guestReaderGrantStatus: row.guest_reader_grant_status,
			hasEffectiveUnitHeadSignature: row.has_effective_unit_head_signature,
			exportGrant: row.export_grant_active && row.export_grant_granted_by
				? {
					active: true,
					grantedBy: row.export_grant_granted_by,
					expiresAt: row.export_grant_valid_to,
					remainingUses: row.export_grant_remaining_uses,
				}
				: null,
		};
	}
}

export default DocumentGovernanceContextAdapter;
