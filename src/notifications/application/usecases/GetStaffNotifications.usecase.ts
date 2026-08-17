import type { NotificationRepositoryPort } from "../port/NotificationsRepo.port.js";

class GetStaffNotificationUseCase {
    constructor(
        private readonly notificationRepository: NotificationRepositoryPort,
    ){}

    async execute(staffId: string) {
        const notifications = await this.notificationRepository.findByRecipientId(staffId);

        return notifications;
    }
}

export default GetStaffNotificationUseCase;
