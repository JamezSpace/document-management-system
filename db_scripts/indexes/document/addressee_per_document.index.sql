CREATE UNIQUE INDEX one_primary_addressee_per_doc
ON document.document_addressee (document_id)
WHERE is_primary = TRUE;