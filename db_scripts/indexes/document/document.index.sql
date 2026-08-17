CREATE UNIQUE INDEX idx_documents_reference_number
ON document.documents(reference_number)
WHERE reference_number IS NOT NULL;