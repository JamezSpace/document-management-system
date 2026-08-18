-- REFERENCE-ONLY SQL CATALOGUE. `db/migrations` is the authoritative schema history.
-- Do not apply this file as a schema change. Add every new or modified database change
-- to a numbered migration first; mirror it here only for browsing or test support.

CREATE UNIQUE INDEX idx_onboarding_session_invite
ON identity.onboarding_sessions(invite_id);

CREATE UNIQUE INDEX idx_unique_active_onboarding_session
ON identity.onboarding_sessions(invite_id)
WHERE status = 'in_progress';
