CREATE UNIQUE INDEX idx_onboarding_session_invite
ON identity.onboarding_sessions(invite_id);

CREATE UNIQUE INDEX idx_unique_active_onboarding_session
ON identity.onboarding_sessions(invite_id)
WHERE status = 'in_progress';