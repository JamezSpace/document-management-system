import type GetStaffNotificationUseCase from "../../application/usecases/GetStaffNotifications.usecase.js";

class NotificationController {
    constructor(
        private readonly getStaffNotificationUseCase: GetStaffNotificationUseCase
    ){}

    async getStaffNotifications(staffId: string) {
        const notifications = await this.getStaffNotificationUseCase.execute(staffId);

        return notifications;
    }
}

export default NotificationController