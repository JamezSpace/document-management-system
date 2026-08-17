import type { PostgresDb } from "@fastify/postgres";
import type { NotificationRepositoryPort } from "../../application/port/NotificationsRepo.port.js";
import Notification from "../../domain/entities/Notifications.js";
import { NotificationRecipientType } from "../../domain/enum/NotificationRecipientType.enum.js";
import { NotificationState } from "../../domain/enum/NotificationState.enum.js";

class NotificationRepositoryAdapter implements NotificationRepositoryPort {
    constructor(private readonly dbPool: PostgresDb) {}

    private toDomain(row: any): Notification {
        const entity = new Notification({
            notificationId: row.id,
            recipientId: row.recipient_id,
            recipientType: row.recipient_type,
            eventType: row.event_type,
            subjectType: row.subject_type,
            subjectId: row.subject_id,
            inAppSubjectName: row.in_app_subject_name,
            emailSubjectHeader: row.email_subject_header,
            messageTemplate: row.message_template,
            payload: row.payload ?? {},
            channel: row.channel,
            priority: row.priority,
            state: row.state as NotificationState,
            createdAt: row.created_at ? new Date(row.created_at) : new Date(),
        });

        return entity;
    }

    async save(notification: Notification): Promise<Notification> {
        const query = `
            INSERT INTO notifications.notifications (
                id,
                recipient_id,
                recipient_type,
                event_type,
                subject_type,
                in_app_subject_name,
                email_subject_header,
                subject_id,
                message_template,
                payload,
                channel,
                priority,
                state,
                retry_count,
                created_at,
                sent_at,
                read_at
            )
            VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17
            )
            RETURNING *;
        `;

        const result = await this.dbPool.query(query, [
            notification.notificationId,
            notification.recipientId,
            notification.recipientType,
            notification.eventType,
            notification.subjectType,
            notification.inAppSubjectName,
            notification.emailSubjectHeader,
            notification.subjectId,
            notification.messageTemplate,
            notification.payload,
            notification.channel,
            notification.priority,
            notification.getState(),
            0,
            notification.createdAt ?? new Date(),
            null,
            null,
        ]);

        return this.toDomain(result.rows[0]);
    }

    async findPending(): Promise<Notification[]> {
        const query = `
            SELECT *
            FROM notifications.notifications
            WHERE state = $1
            ORDER BY created_at ASC;
        `;

        const result = await this.dbPool.query(query, [
            NotificationState.PENDING,
        ]);

        return result.rows.map((row) => this.toDomain(row));
    }

    async findByRecipientId(recipientId: string): Promise<Notification[]> {
        const query = `
            SELECT *
            FROM notifications.notifications
            WHERE recipient_id = $1
              AND recipient_type = $2
            ORDER BY created_at DESC;
        `;

        const result = await this.dbPool.query(query, [
            recipientId,
            NotificationRecipientType.USER,
        ]);

        return result.rows.map((row) => this.toDomain(row));
    }

    async update(notification: Notification): Promise<void> {
        const state = notification.getState();

        const query = `
            UPDATE notifications.notifications
            SET
                state = $2,
                retry_count = CASE WHEN $2 = $3 THEN retry_count + 1 ELSE retry_count END,
                sent_at = CASE WHEN $2 = $4 AND sent_at IS NULL THEN now() ELSE sent_at END,
                read_at = CASE WHEN $2 = $5 AND read_at IS NULL THEN now() ELSE read_at END
            WHERE id = $1;
        `;

        await this.dbPool.query(query, [
            notification.notificationId,
            state,
            NotificationState.FAILED,
            NotificationState.SENT,
            NotificationState.READ,
        ]);
    }
}

export default NotificationRepositoryAdapter;
