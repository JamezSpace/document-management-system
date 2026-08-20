ALTER TYPE dispatch.inbox_entry_status ADD VALUE IF NOT EXISTS 'in_handover';

ALTER TABLE dispatch.inbox_entries
	ADD COLUMN IF NOT EXISTS previous_staff_id VARCHAR(50) REFERENCES identity.staff(id),
	ADD COLUMN IF NOT EXISTS handed_over_at TIMESTAMPTZ;

ALTER TABLE audit.events
	ADD COLUMN IF NOT EXISTS previous_hash CHAR(64),
	ADD COLUMN IF NOT EXISTS event_hash CHAR(64),
	ADD COLUMN IF NOT EXISTS hash_algorithm VARCHAR(30);

CREATE UNIQUE INDEX IF NOT EXISTS audit_event_hash_unique
	ON audit.events(event_hash)
	WHERE event_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS policy.document_governance_grants (
	id VARCHAR(80) PRIMARY KEY,
	document_id VARCHAR(50) NOT NULL REFERENCES document.documents(id) ON DELETE CASCADE,
	grantee_staff_id VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	grant_type VARCHAR(30) NOT NULL CHECK (grant_type IN ('guest_reader', 'export')),
	granted_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	grantor_authority VARCHAR(30) NOT NULL CHECK (grantor_authority IN ('originator', 'unit_head')),
	reason TEXT NOT NULL CHECK (length(trim(reason)) > 0),
	valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	valid_to TIMESTAMPTZ,
	remaining_uses INT CHECK (remaining_uses IS NULL OR remaining_uses >= 0),
	revoked_by VARCHAR(50) REFERENCES identity.staff(id),
	revoked_at TIMESTAMPTZ,
	revocation_reason TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	CHECK (valid_to IS NULL OR valid_to > valid_from),
	CHECK (
		(revoked_at IS NULL AND revoked_by IS NULL AND revocation_reason IS NULL)
		OR (revoked_at IS NOT NULL AND revoked_by IS NOT NULL AND length(trim(revocation_reason)) > 0)
	)
);

CREATE INDEX IF NOT EXISTS document_governance_grant_lookup
	ON policy.document_governance_grants(document_id, grantee_staff_id, grant_type, valid_from, valid_to)
	WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS policy.document_sensitivity_change_requests (
	id VARCHAR(80) PRIMARY KEY,
	document_id VARCHAR(50) NOT NULL REFERENCES document.documents(id) ON DELETE CASCADE,
	from_sensitivity policy.document_sensitivity_level NOT NULL,
	to_sensitivity policy.document_sensitivity_level NOT NULL,
	requested_by VARCHAR(50) NOT NULL REFERENCES identity.staff(id),
	reason TEXT NOT NULL CHECK (length(trim(reason)) > 0),
	status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'applied')),
	reviewed_by VARCHAR(50) REFERENCES identity.staff(id),
	review_reason TEXT,
	requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	reviewed_at TIMESTAMPTZ,
	applied_at TIMESTAMPTZ,
	CHECK (from_sensitivity <> to_sensitivity),
	CHECK (
		(status = 'pending' AND reviewed_by IS NULL AND reviewed_at IS NULL)
		OR (status <> 'pending' AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
	)
);

CREATE UNIQUE INDEX IF NOT EXISTS one_pending_sensitivity_change_per_document
	ON policy.document_sensitivity_change_requests(document_id)
	WHERE status = 'pending';
