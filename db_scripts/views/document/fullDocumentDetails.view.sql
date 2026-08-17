CREATE OR REPLACE VIEW document.full_document_details AS
SELECT 
    doc.*,
    docVersion.id as version_id,
    docVersion.version_number,
    docVersion.content_delta,
    docVersion.media_id,
    docVersion.lifecycle_state,
    docVersion.created_at as version_created_at,
    docVersion.created_by as version_created_by,
    docVersion.state_entered_at as version_state_entered_at,
    docVersion.state_entered_by as version_state_entered_by,

    -- aggregating instead of duplicating rows
    jsonb_agg(
        jsonb_build_object(
            'recipient_unit_id', docAddr.recipient_unit_id,
            'addressed_to_designation_id', docAddr.addressed_to_designation_id,
            'is_primary', docAddr.is_primary
        )
    ) as addressees

FROM document.documents doc
LEFT JOIN document.document_versions docVersion 
    ON docVersion.id = doc.current_version_id
LEFT JOIN document.document_addressee docAddr
    ON docAddr.document_id = doc.id

GROUP BY doc.id, docVersion.id;