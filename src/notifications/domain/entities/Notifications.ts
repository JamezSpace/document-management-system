import type { EventType } from "../../../shared/application/enum/event.enum.js";
import DomainError from "../../../shared/errors/DomainError.error.js";
import { GlobalDomainErrors } from "../../../shared/errors/enum/domain.enum.js";
import type { NotificationPreference } from "../enum/NotificationPreference.enum.js";
import type { NotificationPriority } from "../enum/NotificationPriority.enum.js";
import type { NotificationRecipientType } from "../enum/NotificationRecipientType.enum.js";
import { NotificationState } from "../enum/NotificationState.enum.js";

interface NotificationDTO {
	notificationId: string;

	recipientId: string;
	recipientType: NotificationRecipientType;

	eventType: EventType;
	subjectType: string; // For example: DOCUMENT or WORKFLOW_TASK
	subjectId: string;
	inAppSubjectName?: string;
	emailSubjectHeader?: string;

	messageTemplate: string; 
	payload: Record<string, any>;

	channel: NotificationPreference;
	priority: NotificationPriority;

	state?: NotificationState;
	createdAt?: Date;
}

class Notification {
	readonly notificationId: string;
	readonly recipientId: string;
	readonly recipientType: NotificationRecipientType;
	readonly eventType: EventType;
	readonly subjectType: string;
	readonly subjectId: string;
	readonly inAppSubjectName: string | null;
	readonly emailSubjectHeader: string | null;
	readonly messageTemplate: string;
	readonly payload: Record<string, any>;
	readonly channel: NotificationPreference;
	readonly priority: NotificationPriority;

	private state: NotificationState;
	readonly createdAt: Date;

	constructor(notification: NotificationDTO) {
		this.notificationId = notification.notificationId;
		this.recipientId = notification.recipientId;
		this.recipientType = notification.recipientType;
		this.eventType = notification.eventType;
		this.subjectType = notification.subjectType;
		this.subjectId = notification.subjectId;
		this.inAppSubjectName = notification?.inAppSubjectName ?? null;
		this.emailSubjectHeader = notification?.emailSubjectHeader ?? null;
		this.messageTemplate = notification.messageTemplate;
		this.payload = notification.payload;
		this.channel = notification.channel;
		this.priority = notification.priority;
		this.state = notification?.state ?? NotificationState.PENDING;
		this.createdAt = notification.createdAt ?? new Date();
	}

    markPending() {
        if (this.state !== NotificationState.FAILED) {
			throw new DomainError(
				GlobalDomainErrors.notifications
					.INVALID_NOTIFICATION_STATE_TRANSISITION,
				{
					currentState: this.state,
					targetState: NotificationState.PENDING,
					details: {
						message: "Only failed notifications can set to pending for retries",
					},
				},
			);
		}

        this.state = NotificationState.PENDING;
    }

	markSent() {
		if (this.state !== NotificationState.PENDING) {
			throw new DomainError(
				GlobalDomainErrors.notifications
					.INVALID_NOTIFICATION_STATE_TRANSISITION,
				{
					currentState: this.state,
					targetState: NotificationState.SENT,
					details: {
						message: "Only pending notifications can be sent",
					},
				},
			);
		}

		this.state = NotificationState.SENT;
	}

	markFailed() {
        if (this.state !== NotificationState.PENDING) {
			throw new DomainError(
				GlobalDomainErrors.notifications
					.INVALID_NOTIFICATION_STATE_TRANSISITION,
				{
					currentState: this.state,
					targetState: NotificationState.SENT,
					details: {
						message: "Only pending notifications can fail",
					},
				},
			);
		}

		this.state = NotificationState.FAILED;
	}

	markRead() {
        if (this.state !== NotificationState.SENT) {
			throw new DomainError(
				GlobalDomainErrors.notifications
					.INVALID_NOTIFICATION_STATE_TRANSISITION,
				{
					currentState: this.state,
					targetState: NotificationState.READ,
					details: {
						message: "Only sent notifications can be read!",
					},
				},
			);
		}

		this.state = NotificationState.READ;
	}

	getState() {
		return this.state;
	}
}

export default Notification;
