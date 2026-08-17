-- pending notifications (used by dispatcher)
CREATE INDEX idx_notifications_pending
ON notifications.notifications(state);

-- user notifications (used by user interface to get notifications for user)
CREATE INDEX idx_notifications_recipient
ON notifications.notifications(recipient_id);

-- unread notifications (used for notification badge count)
CREATE INDEX idx_notifications_unread
ON notifications.notifications(recipient_id, read_at);