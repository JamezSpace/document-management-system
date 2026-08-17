CREATE SCHEMA IF NOT EXISTS records;

CREATE TABLE IF NOT EXISTS records.retention_schedules (
	id VARCHAR(80) PRIMARY KEY,
	code VARCHAR(50) NOT NULL UNIQUE,
	name VARCHAR(150) NOT NULL,
	description TEXT,
	office_id VARCHAR(50) REFERENCES identity.offices(id),
	unit_id VARCHAR(50) REFERENCES identity.organizational_units(id),
	is_active BOOLEAN NOT NULL DEFAULT TRUE,
	created_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ,
	version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0)
);

CREATE TABLE IF NOT EXISTS records.retention_schedule_versions (
	id VARCHAR(80) PRIMARY KEY,
	schedule_id VARCHAR(80) NOT NULL REFERENCES records.retention_schedules(id),
	version INTEGER NOT NULL CHECK (version > 0),
	document_type_id VARCHAR(50) REFERENCES document.document_type(id),
	duration_months INTEGER NOT NULL CHECK (duration_months >= 0),
	trigger_event VARCHAR(50) NOT NULL CHECK (
		trigger_event IN (
			'declaration',
			'case_closed',
			'contract_ended',
			'last_action',
			'custom'
		)
	),
	disposition_action VARCHAR(20) NOT NULL CHECK (
		disposition_action IN ('archive', 'destroy', 'review')
	),
	effective_from DATE NOT NULL,
	effective_to DATE,
	approved_by VARCHAR(50) REFERENCES identity.staff(id),
	created_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE (schedule_id, version),
	CHECK (effective_to IS NULL OR effective_to > effective_from)
);

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'retention_schedule_versions_no_overlap'
			AND conrelid = 'records.retention_schedule_versions'::regclass
	) THEN
		ALTER TABLE records.retention_schedule_versions
			ADD CONSTRAINT retention_schedule_versions_no_overlap
			EXCLUDE USING gist (
				schedule_id WITH =,
				daterange(
					effective_from,
					COALESCE(effective_to, 'infinity'::DATE),
					'[)'
				) WITH &&
			);
	END IF;
END
$$;

CREATE TABLE IF NOT EXISTS records.records (
	id VARCHAR(80) PRIMARY KEY,
	office_id VARCHAR(50) NOT NULL REFERENCES identity.offices(id),
	unit_id VARCHAR(50) NOT NULL REFERENCES identity.organizational_units(id),
	registry_entry_id VARCHAR(80) REFERENCES registry.entries(id),
	title VARCHAR(250) NOT NULL,
	status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (
		status IN ('active', 'on_hold', 'transferring', 'archived', 'disposed')
	),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ,
	version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_records_scope_status
	ON records.records (office_id, unit_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS records.record_declarations (
	id VARCHAR(80) PRIMARY KEY,
	record_id VARCHAR(80) NOT NULL UNIQUE REFERENCES records.records(id),
	document_id VARCHAR(50) NOT NULL REFERENCES document.documents(id),
	document_version_id VARCHAR(50) NOT NULL UNIQUE
		REFERENCES document.document_versions(id),
	content_checksum CHAR(64) NOT NULL CHECK (
		content_checksum ~ '^[0-9a-fA-F]{64}$'
	),
	declared_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	declared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	metadata JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (
		jsonb_typeof(metadata) = 'object'
	)
);

CREATE TABLE IF NOT EXISTS records.storage_locations (
	id VARCHAR(80) PRIMARY KEY,
	parent_id VARCHAR(80) REFERENCES records.storage_locations(id),
	office_id VARCHAR(50) NOT NULL REFERENCES identity.offices(id),
	unit_id VARCHAR(50) NOT NULL REFERENCES identity.organizational_units(id),
	location_type VARCHAR(20) NOT NULL CHECK (
		location_type IN ('room', 'cabinet', 'shelf', 'box', 'digital')
	),
	code VARCHAR(80) NOT NULL,
	name VARCHAR(150) NOT NULL,
	is_active BOOLEAN NOT NULL DEFAULT TRUE,
	created_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ,
	version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
	UNIQUE (office_id, code),
	CHECK (parent_id IS NULL OR parent_id <> id)
);

CREATE TABLE IF NOT EXISTS records.record_placements (
	id VARCHAR(80) PRIMARY KEY,
	record_id VARCHAR(80) NOT NULL REFERENCES records.records(id),
	location_id VARCHAR(80) NOT NULL REFERENCES records.storage_locations(id),
	event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('placed', 'removed')),
	related_placement_id VARCHAR(80) REFERENCES records.record_placements(id),
	performed_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_record_placements_timeline
	ON records.record_placements (record_id, performed_at, id);

CREATE TABLE IF NOT EXISTS records.record_retention (
	id VARCHAR(80) PRIMARY KEY,
	record_id VARCHAR(80) NOT NULL REFERENCES records.records(id),
	schedule_version_id VARCHAR(80) NOT NULL
		REFERENCES records.retention_schedule_versions(id),
	trigger_date DATE NOT NULL,
	disposal_eligibility_date DATE NOT NULL,
	supersedes_id VARCHAR(80) REFERENCES records.record_retention(id),
	applied_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CHECK (disposal_eligibility_date >= trigger_date)
);

CREATE INDEX IF NOT EXISTS idx_record_retention_eligibility
	ON records.record_retention (disposal_eligibility_date, record_id);

CREATE TABLE IF NOT EXISTS records.legal_holds (
	id VARCHAR(80) PRIMARY KEY,
	office_id VARCHAR(50) NOT NULL REFERENCES identity.offices(id),
	unit_id VARCHAR(50) NOT NULL REFERENCES identity.organizational_units(id),
	title VARCHAR(200) NOT NULL,
	reason TEXT NOT NULL,
	status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (
		status IN ('active', 'released')
	),
	placed_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	placed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	released_by VARCHAR(50) REFERENCES identity.staff(id),
	released_at TIMESTAMPTZ,
	release_reason TEXT,
	version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
	CHECK (
		(status = 'active' AND released_by IS NULL AND released_at IS NULL)
		OR (status = 'released' AND released_by IS NOT NULL AND released_at IS NOT NULL)
	)
);

CREATE TABLE IF NOT EXISTS records.legal_hold_records (
	id VARCHAR(80) PRIMARY KEY,
	legal_hold_id VARCHAR(80) NOT NULL REFERENCES records.legal_holds(id),
	record_id VARCHAR(80) NOT NULL REFERENCES records.records(id),
	added_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE (legal_hold_id, record_id)
);

CREATE TABLE IF NOT EXISTS records.legal_hold_events (
	id VARCHAR(80) PRIMARY KEY,
	legal_hold_id VARCHAR(80) NOT NULL REFERENCES records.legal_holds(id),
	event_type VARCHAR(20) NOT NULL CHECK (
		event_type IN ('placed', 'record_added', 'released')
	),
	actor_id VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	reason TEXT,
	metadata JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (
		jsonb_typeof(metadata) = 'object'
	),
	occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_legal_hold_records_record
	ON records.legal_hold_records (record_id, legal_hold_id);

CREATE TABLE IF NOT EXISTS records.transfers (
	id VARCHAR(80) PRIMARY KEY,
	office_id VARCHAR(50) NOT NULL REFERENCES identity.offices(id),
	unit_id VARCHAR(50) NOT NULL REFERENCES identity.organizational_units(id),
	from_location_id VARCHAR(80) REFERENCES records.storage_locations(id),
	to_location_id VARCHAR(80) REFERENCES records.storage_locations(id),
	destination JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (
		jsonb_typeof(destination) = 'object'
	),
	status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (
		status IN (
			'pending',
			'approved',
			'rejected',
			'in_transit',
			'completed',
			'cancelled'
		)
	),
	requested_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	approved_by VARCHAR(50) REFERENCES identity.staff(id),
	approved_at TIMESTAMPTZ,
	completed_by VARCHAR(50) REFERENCES identity.staff(id),
	completed_at TIMESTAMPTZ,
	version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0)
);

CREATE TABLE IF NOT EXISTS records.transfer_items (
	id VARCHAR(80) PRIMARY KEY,
	transfer_id VARCHAR(80) NOT NULL REFERENCES records.transfers(id),
	record_id VARCHAR(80) NOT NULL REFERENCES records.records(id),
	added_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE (transfer_id, record_id)
);

CREATE TABLE IF NOT EXISTS records.archive_accessions (
	id VARCHAR(80) PRIMARY KEY,
	transfer_id VARCHAR(80) UNIQUE REFERENCES records.transfers(id),
	accession_number VARCHAR(100) NOT NULL UNIQUE,
	location_id VARCHAR(80) REFERENCES records.storage_locations(id),
	accessioned_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	accessioned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	metadata JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (
		jsonb_typeof(metadata) = 'object'
	)
);

CREATE TABLE IF NOT EXISTS records.disposal_requests (
	id VARCHAR(80) PRIMARY KEY,
	office_id VARCHAR(50) NOT NULL REFERENCES identity.offices(id),
	unit_id VARCHAR(50) NOT NULL REFERENCES identity.organizational_units(id),
	status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (
		status IN ('pending', 'approved', 'rejected', 'executed', 'cancelled')
	),
	reason TEXT NOT NULL,
	required_approvals INTEGER NOT NULL DEFAULT 1 CHECK (required_approvals > 0),
	requested_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	approved_at TIMESTAMPTZ,
	executed_at TIMESTAMPTZ,
	version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0)
);

CREATE TABLE IF NOT EXISTS records.disposal_request_items (
	id VARCHAR(80) PRIMARY KEY,
	disposal_request_id VARCHAR(80) NOT NULL
		REFERENCES records.disposal_requests(id),
	record_id VARCHAR(80) NOT NULL REFERENCES records.records(id),
	retention_assignment_id VARCHAR(80) NOT NULL
		REFERENCES records.record_retention(id),
	added_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE (disposal_request_id, record_id)
);

CREATE TABLE IF NOT EXISTS records.disposal_approvals (
	id VARCHAR(80) PRIMARY KEY,
	disposal_request_id VARCHAR(80) NOT NULL
		REFERENCES records.disposal_requests(id),
	decision VARCHAR(20) NOT NULL CHECK (decision IN ('approved', 'rejected')),
	approver_id VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	reason TEXT,
	decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE (disposal_request_id, approver_id)
);

CREATE TABLE IF NOT EXISTS records.disposal_certificates (
	id VARCHAR(80) PRIMARY KEY,
	disposal_request_id VARCHAR(80) NOT NULL UNIQUE
		REFERENCES records.disposal_requests(id),
	certificate_number VARCHAR(100) NOT NULL UNIQUE,
	executed_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	evidence_media_id VARCHAR(50) REFERENCES media.media_assets(id),
	certificate_checksum CHAR(64) CHECK (
		certificate_checksum IS NULL
		OR certificate_checksum ~ '^[0-9a-fA-F]{64}$'
	),
	metadata JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (
		jsonb_typeof(metadata) = 'object'
	)
);

CREATE INDEX IF NOT EXISTS idx_records_disposal_queue
	ON records.disposal_requests (office_id, unit_id, status, requested_at);

CREATE INDEX IF NOT EXISTS idx_records_transfer_queue
	ON records.transfers (office_id, unit_id, status, requested_at);

CREATE OR REPLACE FUNCTION records.prevent_declared_version_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM records.record_declarations
		WHERE document_version_id = OLD.id
	) THEN
		RAISE EXCEPTION 'Declared document version % is immutable', OLD.id
			USING ERRCODE = '55000';
	END IF;

	IF TG_OP = 'DELETE' THEN
		RETURN OLD;
	END IF;
	RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS prevent_declared_version_mutation
	ON document.document_versions;
CREATE TRIGGER prevent_declared_version_mutation
	BEFORE UPDATE OR DELETE ON document.document_versions
	FOR EACH ROW EXECUTE FUNCTION records.prevent_declared_version_mutation();

DO $$
DECLARE
	table_name TEXT;
BEGIN
	FOREACH table_name IN ARRAY ARRAY[
		'record_declarations',
		'record_placements',
		'record_retention',
		'legal_hold_records',
		'legal_hold_events',
		'transfer_items',
		'archive_accessions',
		'disposal_request_items',
		'disposal_approvals',
		'disposal_certificates'
	]
	LOOP
		EXECUTE format(
			'DROP TRIGGER IF EXISTS prevent_mutation ON records.%I',
			table_name
		);
		EXECUTE format(
			'CREATE TRIGGER prevent_mutation BEFORE UPDATE OR DELETE ON records.%I FOR EACH ROW EXECUTE FUNCTION audit.prevent_append_only_mutation()',
			table_name
		);
	END LOOP;
END
$$;

REVOKE UPDATE, DELETE, TRUNCATE ON
	records.record_declarations,
	records.record_placements,
	records.record_retention,
	records.legal_hold_records,
	records.legal_hold_events,
	records.transfer_items,
	records.archive_accessions,
	records.disposal_request_items,
	records.disposal_approvals,
	records.disposal_certificates
FROM PUBLIC;
