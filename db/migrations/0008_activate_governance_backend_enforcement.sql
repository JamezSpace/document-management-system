DO $$
DECLARE
	prior_policy policy.document_governance_policies%ROWTYPE;
	new_policy_id VARCHAR(80) := 'nexusfons_document_governance_v2';
BEGIN
	INSERT INTO identity.permissions (id, code, description)
	VALUES (
		'perm.document.restricted_view',
		'document.restricted.view',
		'View and create restricted documents when explicitly cleared'
	)
	ON CONFLICT (id) DO UPDATE
	SET code = EXCLUDED.code, description = EXCLUDED.description;

	SELECT * INTO prior_policy
	FROM policy.document_governance_policies
	WHERE policy_key = 'nexusfons_document_governance'
		AND policy_version = 1;

	IF prior_policy.id IS NULL THEN
		RAISE EXCEPTION 'Governance policy version 1 must exist before version 2 is activated';
	END IF;

	IF NOT EXISTS (
		SELECT 1 FROM policy.document_governance_policies
		WHERE policy_key = prior_policy.policy_key AND policy_version = 2
	) THEN
		UPDATE policy.document_governance_policies
		SET status = 'retired', effective_to = NOW()
		WHERE policy_key = prior_policy.policy_key AND status = 'active';

		INSERT INTO policy.document_governance_policies (
			id, policy_key, policy_version, schema_version, status,
			effective_from, effective_to, definition_checksum,
			created_by, approved_by, approval_reason,
			created_at, approved_at, metadata
		) VALUES (
			new_policy_id,
			prior_policy.policy_key,
			2,
			prior_policy.schema_version,
			'active',
			NOW(),
			NULL,
			md5('nexusfons_document_governance_v2_backend_enforcement') ||
				md5('canvas_and_attachment_enforcement'),
			prior_policy.created_by,
			prior_policy.approved_by,
			'Activate backend-enforced document access, attachment and canvas policy decisions.',
			NOW(),
			NOW(),
			prior_policy.metadata || '{"backendEnforcement":"required","canvasProjection":"server_redacted"}'::JSONB
		);

		INSERT INTO policy.document_governance_rules (
			id, governance_policy_id, sensitivity, action, effect,
			conditions, obligations, reason_code, priority, created_by, created_at
		)
		SELECT
			regexp_replace(rule.id, '^DGP-001-', 'DGP-002-'),
			new_policy_id,
			rule.sensitivity,
			rule.action,
			rule.effect,
			rule.conditions,
			CASE
				WHEN rule.sensitivity = 'restricted'
					AND rule.action = 'render_cc_header'
				THEN ARRAY[]::TEXT[]
				ELSE rule.obligations
			END,
			rule.reason_code,
			CASE
				WHEN rule.sensitivity IS NULL AND rule.action = 'assign_sensitivity'
				THEN 20
				ELSE rule.priority
			END,
			rule.created_by,
			NOW()
		FROM policy.document_governance_rules rule
		WHERE rule.governance_policy_id = prior_policy.id;

		INSERT INTO policy.document_governance_rules (
			id, governance_policy_id, sensitivity, action, effect,
			conditions, obligations, reason_code, priority, created_by, created_at
		) VALUES
		(
			'DGP-002-ASSIGN-RES-ALLOW', new_policy_id, 'restricted',
			'assign_sensitivity', 'allow',
			'{"relationshipsAny":["author"],"requiredClearance":true}'::JSONB,
			ARRAY[]::TEXT[], 'restricted_assignment_requires_clearance', 5,
			prior_policy.created_by, NOW()
		),
		(
			'DGP-002-ASSIGN-RES-DENY', new_policy_id, 'restricted',
			'assign_sensitivity', 'deny', '{}'::JSONB,
			ARRAY[]::TEXT[], 'restricted_assignment_requires_clearance', 10,
			prior_policy.created_by, NOW()
		);
	END IF;
END
$$;
