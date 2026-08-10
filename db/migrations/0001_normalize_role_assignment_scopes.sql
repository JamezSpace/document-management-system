CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
	CREATE TYPE identity.authorization_scope_type AS ENUM (
		'organization',
		'unit',
		'office'
	);
EXCEPTION
	WHEN duplicate_object THEN NULL;
END
$$;

ALTER TYPE identity.role_assignments_source
	ADD VALUE IF NOT EXISTS 'delegated';

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'identity'
			AND table_name = 'staff'
			AND column_name = 'acivated_at'
	) AND NOT EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'identity'
			AND table_name = 'staff'
			AND column_name = 'activated_at'
	) THEN
		ALTER TABLE identity.staff RENAME COLUMN acivated_at TO activated_at;
	END IF;
END
$$;

ALTER TABLE identity.role_assignments
	ADD COLUMN IF NOT EXISTS scope_type identity.authorization_scope_type,
	ADD COLUMN IF NOT EXISTS scope_unit_id VARCHAR(50),
	ADD COLUMN IF NOT EXISTS scope_office_id VARCHAR(50),
	ADD COLUMN IF NOT EXISTS assigned_by VARCHAR(50),
	ADD COLUMN IF NOT EXISTS revoked_by VARCHAR(50),
	ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

UPDATE identity.role_assignments
SET
	scope_type = CASE
		WHEN NULLIF(scope ->> 'officeId', '') IS NOT NULL THEN 'office'::identity.authorization_scope_type
		WHEN NULLIF(scope ->> 'unitId', '') IS NOT NULL THEN 'unit'::identity.authorization_scope_type
		ELSE 'organization'::identity.authorization_scope_type
	END,
	scope_unit_id = CASE
		WHEN NULLIF(scope ->> 'officeId', '') IS NULL
			THEN NULLIF(scope ->> 'unitId', '')
		ELSE NULL
	END,
	scope_office_id = NULLIF(scope ->> 'officeId', '')
WHERE scope_type IS NULL;

ALTER TABLE identity.role_assignments
	ALTER COLUMN scope_type SET DEFAULT 'organization',
	ALTER COLUMN scope_type SET NOT NULL;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'fk_role_assignments_scope_unit'
			AND conrelid = 'identity.role_assignments'::regclass
	) THEN
		ALTER TABLE identity.role_assignments
			ADD CONSTRAINT fk_role_assignments_scope_unit
			FOREIGN KEY (scope_unit_id)
			REFERENCES identity.organizational_units(id);
	END IF;

	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'fk_role_assignments_scope_office'
			AND conrelid = 'identity.role_assignments'::regclass
	) THEN
		ALTER TABLE identity.role_assignments
			ADD CONSTRAINT fk_role_assignments_scope_office
			FOREIGN KEY (scope_office_id)
			REFERENCES identity.offices(id);
	END IF;

	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'fk_role_assignments_assigned_by'
			AND conrelid = 'identity.role_assignments'::regclass
	) THEN
		ALTER TABLE identity.role_assignments
			ADD CONSTRAINT fk_role_assignments_assigned_by
			FOREIGN KEY (assigned_by)
			REFERENCES identity.staff(id);
	END IF;

	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'fk_role_assignments_revoked_by'
			AND conrelid = 'identity.role_assignments'::regclass
	) THEN
		ALTER TABLE identity.role_assignments
			ADD CONSTRAINT fk_role_assignments_revoked_by
			FOREIGN KEY (revoked_by)
			REFERENCES identity.staff(id);
	END IF;

	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'role_assignments_valid_range'
			AND conrelid = 'identity.role_assignments'::regclass
	) THEN
		ALTER TABLE identity.role_assignments
			ADD CONSTRAINT role_assignments_valid_range
			CHECK (valid_to IS NULL OR valid_to > valid_from);
	END IF;

	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'role_assignments_scope_shape'
			AND conrelid = 'identity.role_assignments'::regclass
	) THEN
		ALTER TABLE identity.role_assignments
			ADD CONSTRAINT role_assignments_scope_shape CHECK (
				(scope_type = 'organization' AND scope_unit_id IS NULL AND scope_office_id IS NULL)
				OR (scope_type = 'unit' AND scope_unit_id IS NOT NULL AND scope_office_id IS NULL)
				OR (scope_type = 'office' AND scope_unit_id IS NULL AND scope_office_id IS NOT NULL)
			);
	END IF;

	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'role_assignments_revocation_shape'
			AND conrelid = 'identity.role_assignments'::regclass
	) THEN
		ALTER TABLE identity.role_assignments
			ADD CONSTRAINT role_assignments_revocation_shape CHECK (
				(revoked_at IS NULL AND revoked_by IS NULL)
				OR (revoked_at IS NOT NULL AND revoked_by IS NOT NULL)
			);
	END IF;

	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'role_assignments_no_overlapping_scope'
			AND conrelid = 'identity.role_assignments'::regclass
	) THEN
		ALTER TABLE identity.role_assignments
			ADD CONSTRAINT role_assignments_no_overlapping_scope
			EXCLUDE USING gist (
				staff_id WITH =,
				role_id WITH =,
				scope_type WITH =,
				(COALESCE(scope_unit_id, '')) WITH =,
				(COALESCE(scope_office_id, '')) WITH =,
				tstzrange(
					valid_from,
					COALESCE(valid_to, 'infinity'::TIMESTAMPTZ),
					'[)'
				) WITH &&
			)
			WHERE (revoked_at IS NULL);
	END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_role_assignments_effective_staff
	ON identity.role_assignments (staff_id, valid_from, valid_to)
	WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_role_assignments_unit_scope
	ON identity.role_assignments (scope_unit_id, role_id)
	WHERE scope_type = 'unit' AND revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_role_assignments_office_scope
	ON identity.role_assignments (scope_office_id, role_id)
	WHERE scope_type = 'office' AND revoked_at IS NULL;

COMMENT ON COLUMN identity.role_assignments.scope IS
	'Deprecated compatibility column. Use scope_type, scope_unit_id and scope_office_id.';
