import type Notification from "../../domain/entities/Notifications.js";

interface NotificationRepositoryPort {
	save(notification: Notification): Promise<Notification>;

	findByRecipientId(recipientId: string): Promise<Notification[]>;

	findPending(): Promise<Notification[]>;

	update(notification: Notification): Promise<void>;
}

export type { NotificationRepositoryPort };
