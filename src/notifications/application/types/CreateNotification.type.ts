import type { EventType } from "../../../shared/application/enum/event.enum.js";
import type { NotificationPreference } from "../../domain/enum/NotificationPreference.enum.js";
import type { NotificationPriority } from "../../domain/enum/NotificationPriority.enum.js";
import type { NotificationRecipientType } from "../../domain/enum/NotificationRecipientType.enum.js";

interface CreateNotificationType {
    actorId: string;
    recipientId: string;
    recipientType: NotificationRecipientType;
    priority: NotificationPriority;
    channel?: NotificationPreference;
    eventType: EventType;
    subjectType: string;
    inAppSubjectName?: string | null;
    emailSubjectHeader?: string | null;
    subjectId: string;
    payload: Record<string, any>;
}

export type { CreateNotificationType };
