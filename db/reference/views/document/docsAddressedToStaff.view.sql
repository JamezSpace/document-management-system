-- REFERENCE-ONLY SQL CATALOGUE. `db/migrations` is the authoritative schema history.
-- Do not apply this file as a schema change. Add every new or modified database change
-- to a numbered migration first; mirror it here only for browsing or test support.

CREATE OR REPLACE VIEW document.docs_addressed_to_staff AS
SELECT fdd.*, ie.staff_id, ie.status as inbox_status, ie.received_at
FROM dispatch.inbox_entries ie
JOIN document.full_document_details fdd
    ON fdd.id = ie.document_id
WHERE 
    fdd.lifecycle_state IN ('active', 'disposed')
ORDER BY ie.received_at DESC;

