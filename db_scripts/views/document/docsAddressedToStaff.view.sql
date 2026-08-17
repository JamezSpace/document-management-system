CREATE OR REPLACE VIEW document.docs_addressed_to_staff AS
SELECT fdd.*, ie.staff_id, ie.status as inbox_status, ie.received_at
FROM dispatch.inbox_entries ie
JOIN document.full_document_details fdd
    ON fdd.id = ie.document_id
WHERE 
    fdd.lifecycle_state IN ('active', 'disposed')
ORDER BY ie.received_at DESC;

