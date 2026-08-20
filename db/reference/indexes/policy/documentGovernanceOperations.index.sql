-- REFERENCE-ONLY SQL CATALOGUE. `db/migrations` is the authoritative schema history.
-- Do not apply this file as a schema change. Add every new or modified database change
-- to a numbered migration first; mirror it here only for browsing or test support.

CREATE INDEX document_governance_grant_lookup
	ON policy.document_governance_grants(document_id, grantee_staff_id, grant_type, valid_from, valid_to)
	WHERE revoked_at IS NULL;

CREATE UNIQUE INDEX one_pending_sensitivity_change_per_document
	ON policy.document_sensitivity_change_requests(document_id)
	WHERE status = 'pending';
