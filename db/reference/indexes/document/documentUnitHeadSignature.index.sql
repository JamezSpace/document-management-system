-- REFERENCE-ONLY SQL CATALOGUE. `db/migrations` is the authoritative schema history.
-- Do not apply this file as a schema change. Add every new or modified database change
-- to a numbered migration first; mirror it here only for browsing or test support.

CREATE UNIQUE INDEX document_one_effective_unit_head_signature
	ON document.document_unit_head_signatures(document_id)
	WHERE revoked_at IS NULL;
