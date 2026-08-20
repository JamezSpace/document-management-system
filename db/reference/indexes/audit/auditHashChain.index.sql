-- REFERENCE-ONLY SQL CATALOGUE. `db/migrations` is the authoritative schema history.
-- Do not apply this file as a schema change. Add every new or modified database change
-- to a numbered migration first; mirror it here only for browsing or test support.

CREATE UNIQUE INDEX audit_event_hash_unique
	ON audit.events(event_hash)
	WHERE event_hash IS NOT NULL;
