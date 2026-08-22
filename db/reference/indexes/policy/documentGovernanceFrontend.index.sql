-- REFERENCE-ONLY SQL CATALOGUE. `db/migrations` is the authoritative schema history.
-- Do not apply this file as a schema change. Add every new or modified database change
-- to a numbered migration first; mirror it here only for browsing or test support.

CREATE INDEX governance_grants_document_status
	ON policy.document_governance_grants(document_id, created_at DESC, id DESC);

CREATE INDEX sensitivity_change_approval_queue
	ON policy.document_sensitivity_change_requests(status, requested_at, id)
	WHERE status = 'pending';

CREATE INDEX document_extractions_document_history
	ON policy.document_extractions(document_id, created_at DESC);
