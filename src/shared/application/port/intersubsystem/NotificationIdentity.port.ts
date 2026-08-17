import type { StaffIdentity } from "../../types/notificationIdentity/notificationIdentity.type.js";

interface NotificationIdentityPort {
    getStaffById(id: string): Promise<StaffIdentity>
}

export type { NotificationIdentityPort };
