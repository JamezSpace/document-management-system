CREATE SCHEMA IF NOT EXISTS registry;

CREATE TABLE IF NOT EXISTS registry.intakes (
	id VARCHAR(80) PRIMARY KEY,
	office_id VARCHAR(50) NOT NULL REFERENCES identity.offices(id),
	unit_id VARCHAR(50) NOT NULL REFERENCES identity.organizational_units(id),
	channel VARCHAR(30) NOT NULL CHECK (
		channel IN ('physical', 'email', 'courier', 'upload', 'postal', 'other')
	),
	sender JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (
		jsonb_typeof(sender) = 'object'
	),
	subject TEXT NOT NULL,
	document_date DATE,
	received_at TIMESTAMPTZ NOT NULL,
	received_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (
		priority IN ('low', 'normal', 'high', 'urgent')
	),
	status VARCHAR(40) NOT NULL DEFAULT 'received' CHECK (
		status IN (
			'received',
			'awaiting_digitization',
			'digitizing',
			'awaiting_verification',
			'awaiting_registration',
			'awaiting_dispatch',
			'dispatched',
			'closed',
			'cancelled'
		)
	),
	document_id VARCHAR(50) REFERENCES document.documents(id),
	metadata JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (
		jsonb_typeof(metadata) = 'object'
	),
	version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS registry.reference_series (
	id VARCHAR(80) PRIMARY KEY,
	code VARCHAR(50) NOT NULL,
	name VARCHAR(150) NOT NULL,
	office_id VARCHAR(50) REFERENCES identity.offices(id),
	unit_id VARCHAR(50) REFERENCES identity.organizational_units(id),
	format_pattern VARCHAR(250) NOT NULL,
	reset_period VARCHAR(20) NOT NULL DEFAULT 'annual' CHECK (
		reset_period IN ('annual', 'monthly', 'never')
	),
	is_active BOOLEAN NOT NULL DEFAULT TRUE,
	created_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ,
	version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
	CHECK (office_id IS NOT NULL OR unit_id IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_registry_reference_series_scope_code
	ON registry.reference_series (
		COALESCE(office_id, ''),
		COALESCE(unit_id, ''),
		code
	);

CREATE TABLE IF NOT EXISTS registry.reference_sequences (
	series_id VARCHAR(80) NOT NULL REFERENCES registry.reference_series(id),
	period_key VARCHAR(20) NOT NULL,
	current_value BIGINT NOT NULL DEFAULT 0 CHECK (current_value >= 0),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	PRIMARY KEY (series_id, period_key)
);

CREATE TABLE IF NOT EXISTS registry.reference_allocations (
	id VARCHAR(80) PRIMARY KEY,
	series_id VARCHAR(80) NOT NULL REFERENCES registry.reference_series(id),
	period_key VARCHAR(20) NOT NULL,
	sequence_value BIGINT NOT NULL CHECK (sequence_value > 0),
	reference_number VARCHAR(150) NOT NULL UNIQUE,
	intake_id VARCHAR(80) NOT NULL UNIQUE REFERENCES registry.intakes(id),
	allocated_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	allocated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE (series_id, period_key, sequence_value),
	FOREIGN KEY (series_id, period_key)
		REFERENCES registry.reference_sequences(series_id, period_key)
);

CREATE TABLE IF NOT EXISTS registry.digitization_jobs (
	id VARCHAR(80) PRIMARY KEY,
	intake_id VARCHAR(80) NOT NULL REFERENCES registry.intakes(id),
	status VARCHAR(40) NOT NULL DEFAULT 'pending' CHECK (
		status IN (
			'pending',
			'in_progress',
			'awaiting_verification',
			'verified',
			'rejected',
			'failed',
			'cancelled'
		)
	),
	assigned_to VARCHAR(50) REFERENCES identity.staff(id),
	expected_page_count INTEGER CHECK (expected_page_count IS NULL OR expected_page_count > 0),
	started_at TIMESTAMPTZ,
	completed_at TIMESTAMPTZ,
	failure_reason TEXT,
	created_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ,
	version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0)
);

CREATE INDEX IF NOT EXISTS idx_registry_digitization_jobs_queue
	ON registry.digitization_jobs (status, created_at);

CREATE TABLE IF NOT EXISTS registry.scan_pages (
	id VARCHAR(80) PRIMARY KEY,
	digitization_job_id VARCHAR(80) NOT NULL
		REFERENCES registry.digitization_jobs(id) ON DELETE RESTRICT,
	page_number INTEGER NOT NULL CHECK (page_number > 0),
	media_asset_id VARCHAR(50) NOT NULL REFERENCES media.media_assets(id),
	checksum VARCHAR(128) NOT NULL,
	captured_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	metadata JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (
		jsonb_typeof(metadata) = 'object'
	),
	UNIQUE (digitization_job_id, page_number)
);

CREATE TABLE IF NOT EXISTS registry.ocr_runs (
	id VARCHAR(80) PRIMARY KEY,
	digitization_job_id VARCHAR(80) NOT NULL
		REFERENCES registry.digitization_jobs(id) ON DELETE RESTRICT,
	scan_page_id VARCHAR(80) REFERENCES registry.scan_pages(id) ON DELETE RESTRICT,
	provider VARCHAR(80) NOT NULL,
	status VARCHAR(30) NOT NULL DEFAULT 'queued' CHECK (
		status IN ('queued', 'processing', 'completed', 'failed')
	),
	extracted_text TEXT,
	confidence NUMERIC(5, 4) CHECK (
		confidence IS NULL OR (confidence >= 0 AND confidence <= 1)
	),
	provider_output JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (
		jsonb_typeof(provider_output) = 'object'
	),
	started_at TIMESTAMPTZ,
	completed_at TIMESTAMPTZ,
	failure_reason TEXT,
	created_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS registry.scan_verifications (
	id VARCHAR(80) PRIMARY KEY,
	digitization_job_id VARCHAR(80) NOT NULL
		REFERENCES registry.digitization_jobs(id) ON DELETE RESTRICT,
	outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('accepted', 'rejected')),
	verified_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	reason TEXT,
	metadata JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (
		jsonb_typeof(metadata) = 'object'
	),
	verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_registry_scan_verification_accepted
	ON registry.scan_verifications (digitization_job_id)
	WHERE outcome = 'accepted';

CREATE TABLE IF NOT EXISTS registry.entries (
	id VARCHAR(80) PRIMARY KEY,
	intake_id VARCHAR(80) NOT NULL UNIQUE REFERENCES registry.intakes(id),
	reference_allocation_id VARCHAR(80) NOT NULL UNIQUE
		REFERENCES registry.reference_allocations(id),
	office_id VARCHAR(50) NOT NULL REFERENCES identity.offices(id),
	unit_id VARCHAR(50) NOT NULL REFERENCES identity.organizational_units(id),
	document_id VARCHAR(50) REFERENCES document.documents(id),
	document_version_id VARCHAR(50) REFERENCES document.document_versions(id),
	subject TEXT NOT NULL,
	status VARCHAR(30) NOT NULL DEFAULT 'registered' CHECK (
		status IN ('registered', 'awaiting_dispatch', 'dispatched', 'closed')
	),
	current_custodian_type VARCHAR(20) CHECK (
		current_custodian_type IS NULL
		OR current_custodian_type IN ('staff', 'office', 'unit', 'external')
	),
	current_custodian_id VARCHAR(100),
	registered_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
	CHECK (
		(document_id IS NULL AND document_version_id IS NULL)
		OR (document_id IS NOT NULL AND document_version_id IS NOT NULL)
	),
	CHECK (
		(current_custodian_type IS NULL AND current_custodian_id IS NULL)
		OR (current_custodian_type IS NOT NULL AND current_custodian_id IS NOT NULL)
	)
);

CREATE INDEX IF NOT EXISTS idx_registry_entries_scope_status
	ON registry.entries (office_id, unit_id, status, registered_at DESC);

CREATE TABLE IF NOT EXISTS registry.custody_movements (
	id VARCHAR(80) PRIMARY KEY,
	registry_entry_id VARCHAR(80) NOT NULL REFERENCES registry.entries(id),
	event_type VARCHAR(20) NOT NULL CHECK (
		event_type IN ('released', 'received', 'returned', 'located')
	),
	from_custodian_type VARCHAR(20) CHECK (
		from_custodian_type IS NULL
		OR from_custodian_type IN ('staff', 'office', 'unit', 'external')
	),
	from_custodian_id VARCHAR(100),
	to_custodian_type VARCHAR(20) NOT NULL CHECK (
		to_custodian_type IN ('staff', 'office', 'unit', 'external')
	),
	to_custodian_id VARCHAR(100) NOT NULL,
	related_movement_id VARCHAR(80) REFERENCES registry.custody_movements(id),
	performed_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	evidence_media_id VARCHAR(50) REFERENCES media.media_assets(id),
	notes TEXT,
	CHECK (
		(from_custodian_type IS NULL AND from_custodian_id IS NULL)
		OR (from_custodian_type IS NOT NULL AND from_custodian_id IS NOT NULL)
	)
);

CREATE INDEX IF NOT EXISTS idx_registry_custody_movement_timeline
	ON registry.custody_movements (registry_entry_id, performed_at, id);

CREATE TABLE IF NOT EXISTS registry.correspondence_log_entries (
	id VARCHAR(80) PRIMARY KEY,
	registry_entry_id VARCHAR(80) REFERENCES registry.entries(id),
	direction VARCHAR(20) NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
	channel VARCHAR(30) NOT NULL CHECK (
		channel IN ('physical', 'email', 'courier', 'internal', 'postal', 'other')
	),
	reference_number VARCHAR(150),
	counterparty JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (
		jsonb_typeof(counterparty) = 'object'
	),
	subject TEXT NOT NULL,
	dispatch_id VARCHAR(80),
	logged_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	metadata JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (
		jsonb_typeof(metadata) = 'object'
	)
);

CREATE INDEX IF NOT EXISTS idx_registry_correspondence_timeline
	ON registry.correspondence_log_entries (logged_at DESC, id DESC);

DROP TRIGGER IF EXISTS prevent_reference_allocation_mutation
	ON registry.reference_allocations;
CREATE TRIGGER prevent_reference_allocation_mutation
	BEFORE UPDATE OR DELETE ON registry.reference_allocations
	FOR EACH ROW EXECUTE FUNCTION audit.prevent_append_only_mutation();

DROP TRIGGER IF EXISTS prevent_scan_page_mutation ON registry.scan_pages;
CREATE TRIGGER prevent_scan_page_mutation
	BEFORE UPDATE OR DELETE ON registry.scan_pages
	FOR EACH ROW EXECUTE FUNCTION audit.prevent_append_only_mutation();

DROP TRIGGER IF EXISTS prevent_scan_verification_mutation
	ON registry.scan_verifications;
CREATE TRIGGER prevent_scan_verification_mutation
	BEFORE UPDATE OR DELETE ON registry.scan_verifications
	FOR EACH ROW EXECUTE FUNCTION audit.prevent_append_only_mutation();

DROP TRIGGER IF EXISTS prevent_custody_movement_mutation
	ON registry.custody_movements;
CREATE TRIGGER prevent_custody_movement_mutation
	BEFORE UPDATE OR DELETE ON registry.custody_movements
	FOR EACH ROW EXECUTE FUNCTION audit.prevent_append_only_mutation();

DROP TRIGGER IF EXISTS prevent_correspondence_log_mutation
	ON registry.correspondence_log_entries;
CREATE TRIGGER prevent_correspondence_log_mutation
	BEFORE UPDATE OR DELETE ON registry.correspondence_log_entries
	FOR EACH ROW EXECUTE FUNCTION audit.prevent_append_only_mutation();

REVOKE UPDATE, DELETE, TRUNCATE ON
	registry.reference_allocations,
	registry.scan_pages,
	registry.scan_verifications,
	registry.custody_movements,
	registry.correspondence_log_entries
FROM PUBLIC;
