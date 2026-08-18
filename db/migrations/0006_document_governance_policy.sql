DO $$
BEGIN
	IF to_regtype('policy.document_sensitivity_level') IS NULL THEN
		IF to_regtype('document.sensitivity_level') IS NOT NULL THEN
			ALTER TYPE document.sensitivity_level SET SCHEMA policy;
			ALTER TYPE policy.sensitivity_level
				RENAME TO document_sensitivity_level;
		ELSE
			CREATE TYPE policy.document_sensitivity_level AS ENUM (
				'public',
				'internal',
				'confidential',
				'restricted'
			);
		END IF;
	END IF;
END
$$;

-- Repair partially migrated databases where both enum types already exist.
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'document'
			AND table_name = 'documents'
			AND column_name = 'sensitivity'
			AND udt_schema = 'document'
			AND udt_name = 'sensitivity_level'
	) THEN
		ALTER TABLE document.documents
			ALTER COLUMN sensitivity
			TYPE policy.document_sensitivity_level
			USING sensitivity::TEXT::policy.document_sensitivity_level;
	END IF;
END
$$;

DO $$
BEGIN
	CREATE TYPE policy.document_governance_policy_status AS ENUM (
		'draft',
		'approved',
		'active',
		'retired'
	);
EXCEPTION
	WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
	CREATE TYPE policy.document_governance_rule_effect AS ENUM (
		'allow',
		'deny'
	);
EXCEPTION
	WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS policy.document_retention_version_counters (
	document_type_id VARCHAR(50) PRIMARY KEY
		REFERENCES document.document_type(id) ON DELETE CASCADE,
	last_version INT NOT NULL CHECK(last_version > 0)
);

INSERT INTO policy.document_retention_version_counters (
	document_type_id,
	last_version
)
SELECT document_type_id, MAX(policy_version)
FROM policy.document_retention
GROUP BY document_type_id
ON CONFLICT (document_type_id)
DO UPDATE SET last_version = GREATEST(
	policy.document_retention_version_counters.last_version,
	EXCLUDED.last_version
);

DROP FUNCTION IF EXISTS policy.gen_next_policy_version(VARCHAR);

CREATE FUNCTION policy.gen_next_policy_version(_document_type_id VARCHAR)
RETURNS INT
LANGUAGE sql
AS $$
	INSERT INTO policy.document_retention_version_counters AS counter (
		document_type_id,
		last_version
	)
	VALUES (
		_document_type_id,
		(
			SELECT COALESCE(MAX(policy_version), 0) + 1
			FROM policy.document_retention
			WHERE document_type_id = _document_type_id
		)
	)
	ON CONFLICT (document_type_id)
	DO UPDATE SET last_version = GREATEST(
		counter.last_version,
		(
			SELECT COALESCE(MAX(policy_version), 0)
			FROM policy.document_retention
			WHERE document_type_id = _document_type_id
		)
	) + 1
	RETURNING last_version;
$$;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'document_retention_policy_version_positive'
			AND conrelid = 'policy.document_retention'::regclass
	) THEN
		ALTER TABLE policy.document_retention
			ADD CONSTRAINT document_retention_policy_version_positive
			CHECK(policy_version > 0);
	END IF;

	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'document_retention_duration_positive'
			AND conrelid = 'policy.document_retention'::regclass
	) THEN
		ALTER TABLE policy.document_retention
			ADD CONSTRAINT document_retention_duration_positive
			CHECK(retention_duration > 0);
	END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS document_retention_type_effective
	ON policy.document_retention(document_type_id, effective_from);

CREATE TABLE IF NOT EXISTS policy.document_governance_policies (
	id VARCHAR(80) PRIMARY KEY,
	policy_key VARCHAR(100) NOT NULL,
	policy_version INT NOT NULL CHECK(policy_version > 0),
	schema_version INT NOT NULL CHECK(schema_version > 0),
	status policy.document_governance_policy_status NOT NULL DEFAULT 'draft',
	effective_from TIMESTAMPTZ NOT NULL,
	effective_to TIMESTAMPTZ,
	definition_checksum CHAR(64) NOT NULL CHECK(
		definition_checksum ~ '^[0-9a-fA-F]{64}$'
	),
	created_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	approved_by VARCHAR(50) REFERENCES identity.staff(id),
	approval_reason TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	approved_at TIMESTAMPTZ,
	metadata JSONB NOT NULL DEFAULT '{}'::JSONB CHECK(
		jsonb_typeof(metadata) = 'object'
	),
	UNIQUE(policy_key, policy_version),
	CHECK(effective_to IS NULL OR effective_to > effective_from),
	CHECK(
		status = 'draft'
		OR (approved_by IS NOT NULL AND approved_at IS NOT NULL)
	)
);

CREATE UNIQUE INDEX IF NOT EXISTS document_governance_one_active_policy
	ON policy.document_governance_policies(policy_key)
	WHERE status = 'active';

CREATE TABLE IF NOT EXISTS policy.document_governance_rules (
	id VARCHAR(80) PRIMARY KEY,
	governance_policy_id VARCHAR(80) NOT NULL
		REFERENCES policy.document_governance_policies(id) ON DELETE CASCADE,
	sensitivity policy.document_sensitivity_level,
	action VARCHAR(80) NOT NULL,
	effect policy.document_governance_rule_effect NOT NULL,
	conditions JSONB NOT NULL DEFAULT '{}'::JSONB CHECK(
		jsonb_typeof(conditions) = 'object'
	),
	obligations TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
	reason_code VARCHAR(120) NOT NULL,
	priority INT NOT NULL DEFAULT 100 CHECK(priority >= 0),
	created_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS document_governance_scoped_rule_identity
	ON policy.document_governance_rules(
		governance_policy_id,
		sensitivity,
		action,
		priority
	)
	WHERE sensitivity IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS document_governance_global_rule_identity
	ON policy.document_governance_rules(
		governance_policy_id,
		action,
		priority
	)
	WHERE sensitivity IS NULL;

CREATE INDEX IF NOT EXISTS document_governance_rule_lookup
	ON policy.document_governance_rules(
		governance_policy_id,
		sensitivity,
		action,
		priority
	);

ALTER TABLE document.documents
	ADD COLUMN IF NOT EXISTS governance_policy_key VARCHAR(100),
	ADD COLUMN IF NOT EXISTS governance_policy_version INT;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'documents_governance_policy_version_positive'
			AND conrelid = 'document.documents'::regclass
	) THEN
		ALTER TABLE document.documents
			ADD CONSTRAINT documents_governance_policy_version_positive
			CHECK(governance_policy_version > 0);
	END IF;

	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'documents_governance_policy_version_fk'
			AND conrelid = 'document.documents'::regclass
	) THEN
		ALTER TABLE document.documents
			ADD CONSTRAINT documents_governance_policy_version_fk
			FOREIGN KEY (governance_policy_key, governance_policy_version)
			REFERENCES policy.document_governance_policies(policy_key, policy_version);
	END IF;
END
$$;
