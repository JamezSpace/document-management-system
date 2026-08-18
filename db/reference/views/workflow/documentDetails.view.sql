-- REFERENCE-ONLY SQL CATALOGUE. `db/migrations` is the authoritative schema history.
-- Do not apply this file as a schema change. Add every new or modified database change
-- to a numbered migration first; mirror it here only for browsing or test support.

CREATE OR REPLACE VIEW document.workflow_document_details AS
SELECT 
    doc.id, doc.owner_id, staff.unit_id, staff.office_id, staff.designation_id
FROM document.documents doc
LEFT JOIN identity.staff staff
ON doc.owner_id = staff.id;
