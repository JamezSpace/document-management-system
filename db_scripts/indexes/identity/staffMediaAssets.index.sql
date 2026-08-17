CREATE UNIQUE INDEX unique_active_staff_role
ON identity.staff_media_assets (staff_id, asset_role)
WHERE is_active = TRUE;