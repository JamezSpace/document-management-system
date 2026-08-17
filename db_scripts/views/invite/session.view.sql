CREATE OR REPLACE VIEW identity.all_onboarding_sessions AS
SELECT 
    session.id, 
    session.invite_id, 
    session.email, 
    session.current_step, 
    session.primary_data, 
    p_media.storage_provider AS storage_provider, 
    p_media.bucket_name AS profile_picture_bucket_name, 
    p_media.object_key AS profile_picture_object_key, 
    p_media.format AS profile_picture_format, 
    s_media.bucket_name AS signature_bucket_name, 
    s_media.object_key AS signature_object_key, 
    s_media.format AS signature_format, 
    session.status, 
    session.started_at, 
    session.last_active_at, 
    session.completed_at 
FROM identity.onboarding_sessions session
LEFT JOIN media.media_assets p_media
    ON p_media.id = session.profile_picture_media_id
LEFT JOIN media.media_assets s_media
    ON s_media.id = session.signature_media_id;