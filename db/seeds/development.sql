-- Development-only RBAC catalogue.
-- Registry duties are deliberately assigned only through explicit roles.
-- This seed creates no Registry role assignment and no Secretary mapping.

INSERT INTO identity.staff (
	id,
	identity_id,
	staff_number,
	employment_type,
	unit_id,
	office_id,
	designation_id,
	status,
	created_at,
	created_by,
	activated_by,
	activated_at,
	updated_at
)
VALUES (
	'staff.system',
	NULL,
	0,
	'permanent',
	NULL,
	NULL,
	NULL,
	'active',
	NOW(),
	NULL,
	NULL,
	NOW(),
	NULL
)
ON CONFLICT (id) DO NOTHING;

DELETE FROM identity.role_permissions
WHERE permission_id IN (
	SELECT id FROM identity.permissions WHERE code = 'registry.intake'
);

DELETE FROM identity.permissions WHERE code = 'registry.intake';

INSERT INTO identity.permissions (id, code, description)
VALUES
	('perm.registry.intake.view', 'registry.intake.view', 'View Registry intakes within the assigned scope'),
	('perm.registry.intake.create', 'registry.intake.create', 'Create Registry intakes within the assigned scope'),
	('perm.registry.intake.update', 'registry.intake.update', 'Update editable Registry intake metadata'),
	('perm.registry.intake.process', 'registry.intake.process', 'Advance Registry intake processing'),
	('perm.registry.intake.verify', 'registry.intake.verify', 'Verify Registry intake completeness'),
	('perm.registry.digitization.view', 'registry.digitization.view', 'View digitization jobs and scan results'),
	('perm.registry.digitization.process', 'registry.digitization.process', 'Capture scans and submit OCR runs'),
	('perm.registry.digitization.verify', 'registry.digitization.verify', 'Verify digitized scans'),
	('perm.registry.registration.create', 'registry.registration.create', 'Register an intake and allocate its official reference'),
	('perm.registry.entry.view', 'registry.entry.view', 'View Registry entries'),
	('perm.registry.reference_series.view', 'registry.reference_series.view', 'View reference-number series'),
	('perm.registry.reference_series.manage', 'registry.reference_series.manage', 'Create and maintain reference-number series'),
	('perm.registry.dispatch.create', 'registry.dispatch.create', 'Create a dispatch for a registration-ready entry'),
	('perm.registry.dispatch.acknowledge', 'registry.dispatch.acknowledge', 'Record a dispatch acknowledgement'),
	('perm.registry.movement.view', 'registry.movement.view', 'View custody and movement history'),
	('perm.registry.movement.create', 'registry.movement.create', 'Start a custody movement'),
	('perm.registry.movement.receive', 'registry.movement.receive', 'Receive a custody movement'),
	('perm.registry.correspondence.view', 'registry.correspondence.view', 'View scoped correspondence logs'),
	('perm.registry.correspondence.create', 'registry.correspondence.create', 'Create immutable correspondence log entries'),
	('perm.dispatch.view', 'dispatch.view', 'View dispatches within the assigned scope'),
	('perm.dispatch.create', 'dispatch.create', 'Create a dispatch within the assigned scope'),
	('perm.dispatch.acknowledge', 'dispatch.acknowledge', 'Acknowledge receipt of a dispatch'),
	('perm.dispatch.delivery.update', 'dispatch.delivery.update', 'Record dispatch delivery or return evidence'),
	('perm.records.record.view', 'records.record.view', 'View records within the assigned scope'),
	('perm.records.record.declare', 'records.record.declare', 'Declare an immutable record from a document version'),
	('perm.records.location.view', 'records.location.view', 'View physical and digital storage locations'),
	('perm.records.location.manage', 'records.location.manage', 'Create and maintain storage locations'),
	('perm.records.location.place', 'records.location.place', 'Place or remove a record at a storage location'),
	('perm.records.retention.view', 'records.retention.view', 'View retention schedules and assignments'),
	('perm.records.retention.manage', 'records.retention.manage', 'Create versioned retention schedules'),
	('perm.records.retention.apply', 'records.retention.apply', 'Apply a retention schedule to a record'),
	('perm.records.hold.view', 'records.hold.view', 'View legal holds'),
	('perm.records.hold.create', 'records.hold.create', 'Place a legal hold'),
	('perm.records.hold.release', 'records.hold.release', 'Release a legal hold'),
	('perm.records.transfer.view', 'records.transfer.view', 'View record transfers'),
	('perm.records.transfer.create', 'records.transfer.create', 'Request a record transfer'),
	('perm.records.transfer.approve', 'records.transfer.approve', 'Approve or reject a record transfer'),
	('perm.records.transfer.complete', 'records.transfer.complete', 'Complete an approved record transfer'),
	('perm.records.archive.create', 'records.archive.create', 'Create an archive accession'),
	('perm.records.disposal.view', 'records.disposal.view', 'View disposal requests and evidence'),
	('perm.records.disposal.request', 'records.disposal.request', 'Request disposal of eligible records'),
	('perm.records.disposal.approve', 'records.disposal.approve', 'Approve or reject a disposal request'),
	('perm.records.disposal.execute', 'records.disposal.execute', 'Execute an approved disposal request'),
	('perm.audit.event.view', 'audit.event.view', 'View audit events within the assigned scope'),
	('perm.document.classification.manage', 'document.classification.manage', 'Create and maintain document classification reference data'),
	('perm.document.type.manage', 'document.type.manage', 'Create and maintain document types'),
	('perm.organization.manage', 'organization.manage', 'Create and maintain organizational units, offices, and designations')
ON CONFLICT (id) DO UPDATE SET
	code = EXCLUDED.code,
	description = EXCLUDED.description;

INSERT INTO identity.roles (id, name, created_at)
VALUES
	('role.registry_intake_officer', 'registry_intake_officer', NOW()),
	('role.registry_digitization_officer', 'registry_digitization_officer', NOW()),
	('role.registry_registration_officer', 'registry_registration_officer', NOW()),
	('role.registry_dispatch_officer', 'registry_dispatch_officer', NOW()),
	('role.registry_supervisor', 'registry_supervisor', NOW()),
	('role.records_officer', 'records_officer', NOW()),
	('role.records_manager', 'records_manager', NOW()),
	('role.auditor', 'auditor', NOW()),
	('role.document_configuration_manager', 'document_configuration_manager', NOW()),
	('role.organization_administrator', 'organization_administrator', NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

WITH mappings(role_name, capability_code) AS (
	VALUES
		('registry_intake_officer', 'registry.intake.view'),
		('registry_intake_officer', 'registry.intake.create'),
		('registry_intake_officer', 'registry.intake.update'),
		('registry_intake_officer', 'registry.intake.process'),
		('registry_digitization_officer', 'registry.intake.view'),
		('registry_digitization_officer', 'registry.digitization.view'),
		('registry_digitization_officer', 'registry.digitization.process'),
		('registry_registration_officer', 'registry.intake.view'),
		('registry_registration_officer', 'registry.intake.verify'),
		('registry_registration_officer', 'registry.digitization.view'),
		('registry_registration_officer', 'registry.digitization.verify'),
		('registry_registration_officer', 'registry.registration.create'),
		('registry_registration_officer', 'registry.entry.view'),
		('registry_registration_officer', 'registry.reference_series.view'),
		('registry_dispatch_officer', 'registry.entry.view'),
		('registry_dispatch_officer', 'registry.dispatch.create'),
		('registry_dispatch_officer', 'registry.dispatch.acknowledge'),
		('registry_dispatch_officer', 'registry.movement.view'),
		('registry_dispatch_officer', 'registry.movement.create'),
		('registry_dispatch_officer', 'registry.movement.receive'),
		('registry_dispatch_officer', 'registry.correspondence.view'),
		('registry_dispatch_officer', 'registry.correspondence.create'),
		('records_officer', 'records.record.view'),
		('records_officer', 'records.record.declare'),
		('records_officer', 'records.location.view'),
		('records_officer', 'records.location.place'),
		('records_officer', 'records.retention.view'),
		('records_officer', 'records.retention.apply'),
		('records_officer', 'records.hold.view'),
		('records_officer', 'records.transfer.view'),
		('records_officer', 'records.transfer.create'),
		('records_officer', 'records.disposal.view'),
		('records_officer', 'records.disposal.request'),
		('auditor', 'audit.event.view'),
		('document_configuration_manager', 'document.classification.manage'),
		('document_configuration_manager', 'document.type.manage'),
		('organization_administrator', 'organization.manage')
)
INSERT INTO identity.role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM mappings
JOIN identity.roles AS roles ON roles.name = mappings.role_name
JOIN identity.permissions AS permissions
	ON permissions.code = mappings.capability_code
ON CONFLICT DO NOTHING;

INSERT INTO identity.role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM identity.roles AS roles
CROSS JOIN identity.permissions AS permissions
WHERE roles.name = 'registry_supervisor'
	AND permissions.code LIKE 'registry.%'
ON CONFLICT DO NOTHING;

INSERT INTO identity.role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM identity.roles AS roles
CROSS JOIN identity.permissions AS permissions
WHERE roles.name = 'records_manager'
	AND permissions.code LIKE 'records.%'
ON CONFLICT DO NOTHING;

INSERT INTO identity.role_permissions (role_id, permission_id)
SELECT roles.id, permissions.id
FROM identity.roles AS roles
CROSS JOIN identity.permissions AS permissions
WHERE roles.name = 'system_admin'
	AND permissions.code IN (
		'document.classification.manage',
		'document.type.manage',
		'organization.manage'
	)
ON CONFLICT DO NOTHING;

-- Approved document-governance baseline. Re-running the development seed is safe.
INSERT INTO policy.document_governance_policies (
	id, policy_key, policy_version, schema_version, status,
	effective_from, definition_checksum, created_by, approved_by,
	approval_reason, approved_at, metadata
) VALUES (
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
	id, governance_policy_id, sensitivity, action, effect,
	conditions, obligations, reason_code, priority, created_by
) VALUES
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
