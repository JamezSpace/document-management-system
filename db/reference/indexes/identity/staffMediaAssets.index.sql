-- REFERENCE-ONLY SQL CATALOGUE. `db/migrations` is the authoritative schema history.
-- Do not apply this file as a schema change. Add every new or modified database change
-- to a numbered migration first; mirror it here only for browsing or test support.

CREATE UNIQUE INDEX unique_active_staff_role
ON identity.staff_media_assets (staff_id, asset_role)
WHERE is_active = TRUE;
