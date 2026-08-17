CREATE OR REPLACE VIEW document.workflow_document_details AS
SELECT 
    doc.id, doc.owner_id, staff.unit_id, staff.office_id, staff.designation_id
FROM document.documents doc
LEFT JOIN identity.staff staff
ON doc.owner_id = staff.id;