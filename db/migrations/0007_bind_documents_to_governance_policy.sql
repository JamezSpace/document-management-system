INSERT INTO policy.document_governance_policies (
	id,
	policy_key,
	policy_version,
	schema_version,
	status,
	effective_from,
	definition_checksum,
	created_by,
	approved_by,
	approval_reason,
	approved_at,
	metadata
)
VALUES (
	'nexusfons_document_governance',
	'nexusfons_document_governance',
	1,
	1,
	'active',
	'2026-08-18T00:00:00Z',
	'4e3736cb50ff592d67e36ae3dad948a1802cd1722a8149fc2872649b815894e3',
	'staff.system',
	'staff.system',
	'Initial approved document governance baseline',
	NOW(),
	'{"defaultEffect":"deny","classificationVersionBinding":"classification_time","delegation":{"requireExactlyOneEffectiveUnitHead":true,"activeDelegationSupersedesSubstantiveUnitHead":true,"forbidOverlappingDelegations":true},"transfer":{"defaultWorkspaceCustody":"revoke","placeOutstandingWorkInHandover":true,"preserveHistoricalActorAttribution":true},"audit":{"confidentialAndRestrictedViews":"immutable_security_audit","appendOnly":true,"hashChained":true}}'::JSONB
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO policy.document_governance_rules (
	id,
	governance_policy_id,
	sensitivity,
	action,
	effect,
	conditions,
	obligations,
	reason_code,
	priority,
	created_by
)
VALUES
	('DGP-001-ASSIGN', 'nexusfons_document_governance', NULL, 'assign_sensitivity', 'allow', '{"relationshipsAny":["author"]}', ARRAY[]::TEXT[], 'sensitivity_assignment_author_only', 10, 'staff.system'),
	('DGP-001-CHANGE', 'nexusfons_document_governance', NULL, 'change_sensitivity', 'allow', '{"relationshipsAny":["author"],"downgradeRequiresApproval":true,"downgradeRequiresReason":true}', ARRAY['require_downgrade_approval','require_reason','audit_security_event'], 'sensitivity_change_author_only', 10, 'staff.system'),
	('DGP-001-PUB-DISCOVER', 'nexusfons_document_governance', 'public', 'discover', 'allow', '{}', ARRAY[]::TEXT[], 'public_access', 10, 'staff.system'),
	('DGP-001-PUB-VIEW', 'nexusfons_document_governance', 'public', 'view', 'allow', '{}', ARRAY[]::TEXT[], 'public_access', 10, 'staff.system'),
	('DGP-001-PUB-FORWARD', 'nexusfons_document_governance', 'public', 'forward', 'allow', '{}', ARRAY[]::TEXT[], 'public_forwarding_permitted', 10, 'staff.system'),
	('DGP-001-PUB-EXPORT', 'nexusfons_document_governance', 'public', 'export', 'allow', '{}', ARRAY[]::TEXT[], 'public_extraction_permitted', 10, 'staff.system'),
	('DGP-001-PUB-PRINT', 'nexusfons_document_governance', 'public', 'print', 'allow', '{}', ARRAY[]::TEXT[], 'public_extraction_permitted', 10, 'staff.system'),
	('DGP-001-PUB-ATTACH', 'nexusfons_document_governance', 'public', 'attach', 'allow', '{}', ARRAY[]::TEXT[], 'attachments_allowed', 10, 'staff.system'),
	('DGP-001-PUB-CC-MANAGE', 'nexusfons_document_governance', 'public', 'manage_cc', 'allow', '{"relationshipsAny":["author"]}', ARRAY[]::TEXT[], 'cc_management_author_only', 10, 'staff.system'),
	('DGP-001-PUB-CC-RENDER', 'nexusfons_document_governance', 'public', 'render_cc_header', 'allow', '{}', ARRAY[]::TEXT[], 'public_cc_header_visible', 10, 'staff.system'),
	('DGP-001-INT-DISCOVER', 'nexusfons_document_governance', 'internal', 'discover', 'allow', '{"authenticatedInternalStaff":true}', ARRAY[]::TEXT[], 'internal_staff_access_only', 10, 'staff.system'),
	('DGP-001-INT-VIEW', 'nexusfons_document_governance', 'internal', 'view', 'allow', '{"authenticatedInternalStaff":true}', ARRAY[]::TEXT[], 'internal_staff_access_only', 10, 'staff.system'),
	('DGP-001-INT-FORWARD', 'nexusfons_document_governance', 'internal', 'forward', 'allow', '{"authenticatedInternalStaff":true,"forwardDestination":"internal"}', ARRAY[]::TEXT[], 'internal_forwarding_must_remain_internal', 10, 'staff.system'),
	('DGP-001-INT-EXPORT', 'nexusfons_document_governance', 'internal', 'export', 'allow', '{"authenticatedInternalStaff":true}', ARRAY['internal_traceability_watermark'], 'internal_extraction_requires_internal_actor', 10, 'staff.system'),
	('DGP-001-INT-PRINT', 'nexusfons_document_governance', 'internal', 'print', 'allow', '{"authenticatedInternalStaff":true}', ARRAY['internal_traceability_watermark'], 'internal_extraction_requires_internal_actor', 10, 'staff.system'),
	('DGP-001-INT-ATTACH', 'nexusfons_document_governance', 'internal', 'attach', 'allow', '{}', ARRAY[]::TEXT[], 'attachments_allowed', 10, 'staff.system'),
	('DGP-001-INT-CC-MANAGE', 'nexusfons_document_governance', 'internal', 'manage_cc', 'allow', '{"relationshipsAny":["author"]}', ARRAY[]::TEXT[], 'cc_management_author_only', 10, 'staff.system'),
	('DGP-001-INT-CC-RENDER', 'nexusfons_document_governance', 'internal', 'render_cc_header', 'allow', '{"internalCanvas":true}', ARRAY[]::TEXT[], 'internal_cc_header_internal_canvas_only', 10, 'staff.system'),
	('DGP-001-CON-DISCOVER', 'nexusfons_document_governance', 'confidential', 'discover', 'allow', '{"relationshipsAny":["author","target_handler","authorized_custodian","unit_head","delegated_unit_head","guest_reader"],"guestReaderRequiresActiveGrant":true}', ARRAY['audit_security_event'], 'confidential_explicit_or_custodian_access_only', 10, 'staff.system'),
	('DGP-001-CON-VIEW', 'nexusfons_document_governance', 'confidential', 'view', 'allow', '{"relationshipsAny":["author","target_handler","authorized_custodian","unit_head","delegated_unit_head","guest_reader"],"guestReaderRequiresActiveGrant":true}', ARRAY['audit_security_event'], 'confidential_explicit_or_custodian_access_only', 10, 'staff.system'),
	('DGP-001-CON-FORWARD', 'nexusfons_document_governance', 'confidential', 'forward', 'allow', '{"relationshipsAny":["author","authorized_custodian"],"recordedJustification":true}', ARRAY['require_reason','audit_justification','audit_security_event'], 'confidential_forward_requires_custody_and_justification', 10, 'staff.system'),
	('DGP-001-CON-EXPORT', 'nexusfons_document_governance', 'confidential', 'export', 'allow', '{"activeUnexpiredDynamicGrant":true}', ARRAY['identity_timestamp_watermark','audit_security_event'], 'confidential_extraction_requires_dynamic_grant', 10, 'staff.system'),
	('DGP-001-CON-PRINT', 'nexusfons_document_governance', 'confidential', 'print', 'allow', '{"activeUnexpiredDynamicGrant":true}', ARRAY['identity_timestamp_watermark','audit_security_event'], 'confidential_extraction_requires_dynamic_grant', 10, 'staff.system'),
	('DGP-001-CON-ATTACH', 'nexusfons_document_governance', 'confidential', 'attach', 'deny', '{}', ARRAY[]::TEXT[], 'attachments_blocked_for_sensitive_document', 10, 'staff.system'),
	('DGP-001-CON-CC-MANAGE', 'nexusfons_document_governance', 'confidential', 'manage_cc', 'allow', '{"relationshipsAny":["author"]}', ARRAY[]::TEXT[], 'cc_management_author_only', 10, 'staff.system'),
	('DGP-001-CON-CC-RENDER', 'nexusfons_document_governance', 'confidential', 'render_cc_header', 'deny', '{}', ARRAY['redact_cc_header'], 'confidential_cc_header_redacted', 10, 'staff.system'),
	('DGP-001-RES-DISCOVER', 'nexusfons_document_governance', 'restricted', 'discover', 'allow', '{"relationshipsAny":["named_individual"],"requiredClearance":true}', ARRAY['audit_security_event'], 'restricted_named_individual_and_clearance_required', 10, 'staff.system'),
	('DGP-001-RES-VIEW', 'nexusfons_document_governance', 'restricted', 'view', 'allow', '{"relationshipsAny":["named_individual"],"requiredClearance":true}', ARRAY['audit_security_event'], 'restricted_named_individual_and_clearance_required', 10, 'staff.system'),
	('DGP-001-RES-FORWARD', 'nexusfons_document_governance', 'restricted', 'forward', 'deny', '{}', ARRAY['audit_security_event'], 'restricted_forwarding_prohibited', 10, 'staff.system'),
	('DGP-001-RES-EXPORT', 'nexusfons_document_governance', 'restricted', 'export', 'deny', '{}', ARRAY['audit_security_event'], 'restricted_extraction_prohibited', 10, 'staff.system'),
	('DGP-001-RES-PRINT', 'nexusfons_document_governance', 'restricted', 'print', 'deny', '{}', ARRAY['audit_security_event'], 'restricted_extraction_prohibited', 10, 'staff.system'),
	('DGP-001-RES-ATTACH', 'nexusfons_document_governance', 'restricted', 'attach', 'deny', '{}', ARRAY[]::TEXT[], 'attachments_blocked_for_sensitive_document', 10, 'staff.system'),
	('DGP-001-RES-CC-MANAGE', 'nexusfons_document_governance', 'restricted', 'manage_cc', 'allow', '{"relationshipsAny":["primary_authorizing_desk"]}', ARRAY['audit_security_event'], 'restricted_cc_managed_by_primary_authorizing_desk_only', 10, 'staff.system'),
	('DGP-001-RES-CC-RENDER', 'nexusfons_document_governance', 'restricted', 'render_cc_header', 'allow', '{"relationshipsAny":["primary_authorizing_desk"]}', ARRAY['redact_cc_header'], 'restricted_cc_header_primary_authorizing_desk_only', 10, 'staff.system')
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
	baseline_rule_count INT;
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM policy.document_governance_policies
		WHERE id = 'nexusfons_document_governance'
			AND policy_key = 'nexusfons_document_governance'
			AND policy_version = 1
			AND schema_version = 1
			AND status = 'active'
			AND definition_checksum = '4e3736cb50ff592d67e36ae3dad948a1802cd1722a8149fc2872649b815894e3'
	) THEN
		RAISE EXCEPTION 'Document governance baseline policy does not match version 1';
	END IF;

	SELECT COUNT(*)
	INTO baseline_rule_count
	FROM policy.document_governance_rules
	WHERE governance_policy_id = 'nexusfons_document_governance';

	IF baseline_rule_count <> 34 THEN
		RAISE EXCEPTION 'Document governance baseline expected 34 rules, found %', baseline_rule_count;
	END IF;

	IF EXISTS (
		SELECT 1
		FROM document.documents
		WHERE (governance_policy_key IS NULL)
			<> (governance_policy_version IS NULL)
	) THEN
		RAISE EXCEPTION 'Cannot backfill documents with partial governance policy bindings';
	END IF;

	UPDATE document.documents
	SET
		governance_policy_key = 'nexusfons_document_governance',
		governance_policy_version = 1
	WHERE governance_policy_key IS NULL
		AND governance_policy_version IS NULL;

	IF EXISTS (
		SELECT 1
		FROM document.documents
		WHERE governance_policy_key IS NULL
			OR governance_policy_version IS NULL
	) THEN
		RAISE EXCEPTION 'Document governance policy backfill was incomplete';
	END IF;
END
$$;

ALTER TABLE document.documents
	ALTER COLUMN governance_policy_key SET NOT NULL,
	ALTER COLUMN governance_policy_version SET NOT NULL;
