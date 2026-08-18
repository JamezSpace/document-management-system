-- REFERENCE-ONLY SQL CATALOGUE. `db/migrations` is the authoritative schema history.
-- Do not apply this file as a schema change. Add every new or modified database change
-- to a numbered migration first; mirror it here only for browsing or test support.

-- pending notifications (used by dispatcher)
CREATE INDEX idx_notifications_pending
ON notifications.notifications(state);

-- user notifications (used by user interface to get notifications for user)
CREATE INDEX idx_notifications_recipient
ON notifications.notifications(recipient_id);

-- unread notifications (used for notification badge count)
CREATE INDEX idx_notifications_unread
ON notifications.notifications(recipient_id, read_at);
