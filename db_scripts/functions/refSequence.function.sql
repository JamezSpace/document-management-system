CREATE OR REPLACE FUNCTION document.next_reference_sequence(
    p_year INT,
    p_origin_unit_id VARCHAR,
    p_recipient_unit_id VARCHAR,
    p_subject_code VARCHAR,
    p_function_code VARCHAR
)
RETURNS TABLE (
    next_count INT,
    origin_unit TEXT,
    recipient_unit TEXT
)
LANGUAGE sql
AS $$
    WITH seq AS (
        INSERT INTO document.reference_sequences (
            year,
            origin_unit_id,
            recipient_unit_id,
            subject_code,
            function_code,
            current_value
        )
        VALUES (
            p_year,
            p_origin_unit_id,
            p_recipient_unit_id,
            p_subject_code,
            p_function_code,
            1
        )

        ON CONFLICT (
            year,
            origin_unit_id,
            recipient_unit_id,
            subject_code,
            function_code
        )
        DO UPDATE
        SET current_value =
            document.reference_sequences.current_value + 1
        RETURNING
            current_value,
            origin_unit_id,
            recipient_unit_id
    )

    SELECT
        seq.current_value AS next_count,
        origin.code AS origin_unit,
        recipient.code AS recipient_unit
    FROM seq
    JOIN identity.organizational_units origin
        ON origin.id = seq.origin_unit_id
    LEFT JOIN identity.organizational_units recipient
        ON recipient.id = seq.recipient_unit_id;
$$;