import type { PostgresDb } from "@fastify/postgres";
import type { NotificationIdentityPort } from "../../../../../../shared/application/port/intersubsystem/NotificationIdentity.port.js";
import type { StaffIdentity } from "../../../../../../shared/application/types/notificationIdentity/notificationIdentity.type.js";

class NotificationIdentityAdapter implements NotificationIdentityPort {
    constructor(private readonly dbPool: PostgresDb) {}

    async getStaffById(staffId: string): Promise<StaffIdentity> {
        const result = await this.dbPool.query(`SELECT id, first_name, last_name, email FROM identity.staff_details where id = $1`, [staffId]);

        const staffIdentity = result.rows[0];
        
        return {
            id: staffIdentity.id,
            email: staffIdentity.email,
            firstName: staffIdentity.first_name,
            lastName: staffIdentity.last_name,
        }
    }
}

export default NotificationIdentityAdapter;