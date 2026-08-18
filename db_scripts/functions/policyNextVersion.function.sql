DROP FUNCTION IF EXISTS policy.gen_next_policy_version(VARCHAR);

CREATE FUNCTION policy.gen_next_policy_version(_document_type_id VARCHAR)
RETURNS INT
LANGUAGE sql
AS $$
	INSERT INTO policy.document_retention_version_counters AS counter (
		document_type_id,
		last_version
	)
	VALUES (
		_document_type_id,
		(
			SELECT COALESCE(MAX(policy_version), 0) + 1
			FROM policy.document_retention
			WHERE document_type_id = _document_type_id
		)
	)
	ON CONFLICT (document_type_id)
	DO UPDATE SET last_version = GREATEST(
		counter.last_version,
		(
			SELECT COALESCE(MAX(policy_version), 0)
			FROM policy.document_retention
			WHERE document_type_id = _document_type_id
		)
	) + 1
	RETURNING last_version;
$$;
