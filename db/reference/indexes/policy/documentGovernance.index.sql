-- REFERENCE-ONLY SQL CATALOGUE. `db/migrations` is the authoritative schema history.
-- Do not apply this file as a schema change. Add every new or modified database change
-- to a numbered migration first; mirror it here only for browsing or test support.

CREATE UNIQUE INDEX document_governance_one_active_policy
	ON policy.document_governance_policies(policy_key)
	WHERE status = 'active';

CREATE UNIQUE INDEX document_governance_scoped_rule_identity
	ON policy.document_governance_rules(
		governance_policy_id,
		sensitivity,
		action,
		priority
	)
	WHERE sensitivity IS NOT NULL;

CREATE UNIQUE INDEX document_governance_global_rule_identity
	ON policy.document_governance_rules(
		governance_policy_id,
		action,
		priority
	)
	WHERE sensitivity IS NULL;

CREATE INDEX document_governance_rule_lookup
	ON policy.document_governance_rules(
		governance_policy_id,
		sensitivity,
		action,
		priority
	);
