-- REFERENCE-ONLY SQL CATALOGUE. `db/migrations` is the authoritative schema history.
-- Do not apply this file as a schema change. Add every new or modified database change
-- to a numbered migration first; mirror it here only for browsing or test support.

CREATE UNIQUE INDEX idx_documents_reference_number
ON document.documents(reference_number)
WHERE reference_number IS NOT NULL;
