CREATE SCHEMA IF NOT EXISTS audit;

CREATE TABLE IF NOT EXISTS audit.events (
	id VARCHAR(80) PRIMARY KEY,
	actor_id VARCHAR(80) NOT NULL,
	actor_type VARCHAR(20) NOT NULL CHECK (
		actor_type IN ('staff', 'system', 'external')
	),
	capability VARCHAR(150),
	action VARCHAR(100) NOT NULL,
	event_type VARCHAR(150) NOT NULL,
	aggregate_type VARCHAR(100) NOT NULL,
	aggregate_id VARCHAR(100) NOT NULL,
	office_id VARCHAR(50) REFERENCES identity.offices(id),
	unit_id VARCHAR(50) REFERENCES identity.organizational_units(id),
	outcome VARCHAR(20) NOT NULL CHECK (
		outcome IN ('success', 'denied', 'failed')
	),
	reason TEXT,
	request_id VARCHAR(100),
	correlation_id VARCHAR(100),
	metadata JSONB NOT NULL DEFAULT '{}'::JSONB CHECK (
		jsonb_typeof(metadata) = 'object'
	),
	occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION audit.prevent_append_only_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
	RAISE EXCEPTION '% is append-only; % is not permitted', TG_TABLE_NAME, TG_OP
		USING ERRCODE = '55000';
END
$$;

DROP TRIGGER IF EXISTS prevent_audit_event_mutation ON audit.events;
CREATE TRIGGER prevent_audit_event_mutation
	BEFORE UPDATE OR DELETE ON audit.events
	FOR EACH ROW
	EXECUTE FUNCTION audit.prevent_append_only_mutation();

REVOKE UPDATE, DELETE, TRUNCATE ON audit.events FROM PUBLIC;

CREATE INDEX IF NOT EXISTS idx_audit_events_aggregate
	ON audit.events (aggregate_type, aggregate_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_events_actor
	ON audit.events (actor_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_events_office
	ON audit.events (office_id, occurred_at DESC)
	WHERE office_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_events_unit
	ON audit.events (unit_id, occurred_at DESC)
	WHERE unit_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_events_correlation
	ON audit.events (correlation_id, occurred_at)
	WHERE correlation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_events_type
	ON audit.events (event_type, occurred_at DESC);

COMMENT ON TABLE audit.events IS
	'Immutable security and business evidence. Business mutations append within the same transaction.';
