CREATE OR REPLACE FUNCTION policy.gen_next_policy_version(doc_type_id varchar)
RETURNS INT
LANGUAGE sql
as $$
    SELECT COALESCE(MAX(policy_version), 0) + 1
    FROM policy.document_retention
    WHERE document_type_id = doc_type_id
$$