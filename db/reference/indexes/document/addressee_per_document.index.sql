-- REFERENCE-ONLY SQL CATALOGUE. `db/migrations` is the authoritative schema history.
-- Do not apply this file as a schema change. Add every new or modified database change
-- to a numbered migration first; mirror it here only for browsing or test support.

CREATE UNIQUE INDEX one_primary_addressee_per_doc
ON document.document_addressee (document_id)
WHERE is_primary = TRUE;
