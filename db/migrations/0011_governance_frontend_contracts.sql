ALTER TABLE document.documents
	ADD COLUMN IF NOT EXISTS revision BIGINT NOT NULL DEFAULT 1;

ALTER TABLE document.documents
	DROP CONSTRAINT IF EXISTS document_revision_positive;

ALTER TABLE document.documents
	ADD CONSTRAINT document_revision_positive CHECK (revision > 0);

CREATE INDEX IF NOT EXISTS document_search_cursor
	ON document.documents(created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS governance_grants_document_status
	ON policy.document_governance_grants(document_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS sensitivity_change_approval_queue
	ON policy.document_sensitivity_change_requests(status, requested_at, id)
	WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS policy.document_extractions (
	id VARCHAR(80) PRIMARY KEY,
	document_id VARCHAR(50) NOT NULL REFERENCES document.documents(id) ON DELETE CASCADE,
	document_revision BIGINT NOT NULL,
	actor_staff_id VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	extraction_action VARCHAR(20) NOT NULL CHECK (extraction_action IN ('export', 'print')),
	grant_id VARCHAR(80) REFERENCES policy.document_governance_grants(id),
	policy_key VARCHAR(100) NOT NULL,
	policy_version INT NOT NULL CHECK (policy_version > 0),
	obligations TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
	watermark_text TEXT,
	artifact_sha256 CHAR(64) NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS document_extractions_document_history
	ON policy.document_extractions(document_id, created_at DESC);

CREATE TRIGGER prevent_document_extraction_mutation
	BEFORE UPDATE OR DELETE ON policy.document_extractions
	FOR EACH ROW EXECUTE FUNCTION audit.prevent_append_only_mutation();

REVOKE UPDATE, DELETE, TRUNCATE ON policy.document_extractions FROM PUBLIC;
