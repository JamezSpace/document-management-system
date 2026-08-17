DO $$
BEGIN
	CREATE TYPE dispatch.delivery_channel AS ENUM (
		'internal_inbox',
		'email',
		'courier',
		'hand_delivery',
		'postal'
	);
EXCEPTION
	WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
	CREATE TYPE dispatch.recipient_type AS ENUM (
		'staff',
		'designation',
		'office',
		'unit',
		'external'
	);
EXCEPTION
	WHEN duplicate_object THEN NULL;
END
$$;

DO $$
BEGIN
	CREATE TYPE dispatch.source_type AS ENUM ('document', 'registry_entry');
EXCEPTION
	WHEN duplicate_object THEN NULL;
END
$$;

ALTER TYPE dispatch.status ADD VALUE IF NOT EXISTS 'in_transit';
ALTER TYPE dispatch.status ADD VALUE IF NOT EXISTS 'returned';
ALTER TYPE dispatch.status ADD VALUE IF NOT EXISTS 'failed';
ALTER TYPE dispatch.status ADD VALUE IF NOT EXISTS 'cancelled';

ALTER TABLE dispatch.dispatch_records
	ALTER COLUMN document_id DROP NOT NULL,
	ALTER COLUMN recipient_unit_id DROP NOT NULL,
	ADD COLUMN IF NOT EXISTS source_type dispatch.source_type
		NOT NULL DEFAULT 'document',
	ADD COLUMN IF NOT EXISTS registry_entry_id VARCHAR(80)
		REFERENCES registry.entries(id),
	ADD COLUMN IF NOT EXISTS recipient_type dispatch.recipient_type
		NOT NULL DEFAULT 'designation',
	ADD COLUMN IF NOT EXISTS recipient_staff_id VARCHAR(50)
		REFERENCES identity.staff(id),
	ADD COLUMN IF NOT EXISTS recipient_office_id VARCHAR(50)
		REFERENCES identity.offices(id),
	ADD COLUMN IF NOT EXISTS external_recipient JSONB,
	ADD COLUMN IF NOT EXISTS delivery_channel dispatch.delivery_channel
		NOT NULL DEFAULT 'internal_inbox',
	ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(150),
	ADD COLUMN IF NOT EXISTS acknowledgement_required BOOLEAN
		NOT NULL DEFAULT FALSE,
	ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
	ADD COLUMN IF NOT EXISTS returned_at TIMESTAMPTZ,
	ADD COLUMN IF NOT EXISTS failure_reason TEXT,
	ADD COLUMN IF NOT EXISTS delivery_evidence_media_id VARCHAR(50)
		REFERENCES media.media_assets(id),
	ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'dispatch_records_source_shape'
			AND conrelid = 'dispatch.dispatch_records'::regclass
	) THEN
		ALTER TABLE dispatch.dispatch_records
			ADD CONSTRAINT dispatch_records_source_shape CHECK (
				(source_type = 'document' AND document_id IS NOT NULL AND registry_entry_id IS NULL)
				OR (
					source_type = 'registry_entry'
					AND document_id IS NULL
					AND registry_entry_id IS NOT NULL
				)
			) NOT VALID;
	END IF;

	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'dispatch_records_recipient_shape'
			AND conrelid = 'dispatch.dispatch_records'::regclass
	) THEN
		ALTER TABLE dispatch.dispatch_records
			ADD CONSTRAINT dispatch_records_recipient_shape CHECK (
				(recipient_type = 'staff' AND recipient_staff_id IS NOT NULL)
				OR (
					recipient_type = 'designation'
					AND recipient_designation_id IS NOT NULL
					AND recipient_unit_id IS NOT NULL
				)
				OR (recipient_type = 'office' AND recipient_office_id IS NOT NULL)
				OR (recipient_type = 'unit' AND recipient_unit_id IS NOT NULL)
				OR (
					recipient_type = 'external'
					AND external_recipient IS NOT NULL
					AND jsonb_typeof(external_recipient) = 'object'
				)
			) NOT VALID;
	END IF;

	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'dispatch_records_version_positive'
			AND conrelid = 'dispatch.dispatch_records'::regclass
	) THEN
		ALTER TABLE dispatch.dispatch_records
			ADD CONSTRAINT dispatch_records_version_positive
			CHECK (version > 0);
	END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_dispatch_tracking_number
	ON dispatch.dispatch_records (delivery_channel, tracking_number)
	WHERE tracking_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dispatch_registry_entry
	ON dispatch.dispatch_records (registry_entry_id, dispatched_at DESC)
	WHERE registry_entry_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dispatch_delivery_queue
	ON dispatch.dispatch_records (status, delivery_channel, dispatched_at);

CREATE TABLE IF NOT EXISTS dispatch.dispatch_acknowledgements (
	id VARCHAR(80) PRIMARY KEY,
	dispatch_id VARCHAR(80) NOT NULL REFERENCES dispatch.dispatch_records(id),
	acknowledged_by_staff_id VARCHAR(50) REFERENCES identity.staff(id),
	external_acknowledger_name VARCHAR(200),
	evidence_media_id VARCHAR(50) REFERENCES media.media_assets(id),
	notes TEXT,
	acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	created_by VARCHAR(50) REFERENCES identity.staff(id),
	CHECK (
		(acknowledged_by_staff_id IS NOT NULL AND external_acknowledger_name IS NULL)
		OR (
			acknowledged_by_staff_id IS NULL
			AND external_acknowledger_name IS NOT NULL
		)
	)
);

CREATE INDEX IF NOT EXISTS idx_dispatch_acknowledgements_dispatch
	ON dispatch.dispatch_acknowledgements (dispatch_id, acknowledged_at);

DROP TRIGGER IF EXISTS prevent_dispatch_acknowledgement_mutation
	ON dispatch.dispatch_acknowledgements;
CREATE TRIGGER prevent_dispatch_acknowledgement_mutation
	BEFORE UPDATE OR DELETE ON dispatch.dispatch_acknowledgements
	FOR EACH ROW EXECUTE FUNCTION audit.prevent_append_only_mutation();

REVOKE UPDATE, DELETE, TRUNCATE
	ON dispatch.dispatch_acknowledgements FROM PUBLIC;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'fk_registry_correspondence_dispatch'
			AND conrelid = 'registry.correspondence_log_entries'::regclass
	) THEN
		ALTER TABLE registry.correspondence_log_entries
			ADD CONSTRAINT fk_registry_correspondence_dispatch
			FOREIGN KEY (dispatch_id)
			REFERENCES dispatch.dispatch_records(id);
	END IF;
END
$$;
