CREATE TABLE IF NOT EXISTS document.document_unit_head_signatures (
	id VARCHAR(80) PRIMARY KEY,
	document_id VARCHAR(50) NOT NULL
		REFERENCES document.documents(id) ON DELETE CASCADE,
	signed_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	revoked_by VARCHAR(50) REFERENCES identity.staff(id),
	revoked_at TIMESTAMPTZ,
	revocation_reason TEXT,
	CHECK (
		(revoked_at IS NULL AND revoked_by IS NULL AND revocation_reason IS NULL)
		OR (revoked_at IS NOT NULL AND revoked_by IS NOT NULL AND revocation_reason IS NOT NULL)
	)
);

CREATE UNIQUE INDEX IF NOT EXISTS document_one_effective_unit_head_signature
	ON document.document_unit_head_signatures(document_id)
	WHERE revoked_at IS NULL;

DO $$
DECLARE
	prior_policy policy.document_governance_policies%ROWTYPE;
	new_policy_id VARCHAR(80) := 'nexusfons_document_governance_v3';
BEGIN
	SELECT * INTO prior_policy
	FROM policy.document_governance_policies
	WHERE policy_key = 'nexusfons_document_governance'
		AND policy_version = 2;

	IF prior_policy.id IS NULL THEN
		RAISE EXCEPTION 'Governance policy version 2 must exist before version 3 is activated';
	END IF;

	IF NOT EXISTS (
		SELECT 1 FROM policy.document_governance_policies
		WHERE policy_key = prior_policy.policy_key AND policy_version = 3
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
			new_policy_id, prior_policy.policy_key, 3, prior_policy.schema_version,
			'active', NOW(), NULL,
			md5('nexusfons_document_governance_v3_internal_signature') ||
				md5('internal_attachment_unit_head_prerequisite'),
			prior_policy.created_by, prior_policy.approved_by,
			'Enforce effective Unit Head signature evidence before internal attachments.',
			NOW(), NOW(),
			prior_policy.metadata || '{"internalAttachment":"effective_unit_head_signature_required"}'::JSONB
		);

		INSERT INTO policy.document_governance_rules (
			id, governance_policy_id, sensitivity, action, effect,
			conditions, obligations, reason_code, priority, created_by, created_at
		)
		SELECT
			regexp_replace(rule.id, '^DGP-002-', 'DGP-003-'),
			new_policy_id,
			rule.sensitivity,
			rule.action,
			rule.effect,
			CASE
				WHEN rule.sensitivity = 'internal' AND rule.action = 'attach'
				THEN rule.conditions || '{"effectiveUnitHeadSignature":true}'::JSONB
				ELSE rule.conditions
			END,
			rule.obligations,
			CASE
				WHEN rule.sensitivity = 'internal' AND rule.action = 'attach'
				THEN 'internal_attachment_requires_unit_head_signature'
				ELSE rule.reason_code
			END,
			rule.priority,
			rule.created_by,
			NOW()
		FROM policy.document_governance_rules rule
		WHERE rule.governance_policy_id = prior_policy.id;
	END IF;
END
$$;
