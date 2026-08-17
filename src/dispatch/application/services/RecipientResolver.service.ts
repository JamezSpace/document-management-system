import type { DispatchDocumentPort } from "../../../shared/application/port/intersubsystem/DispatchDocument.port.js";
import type { DispatchStaffPort } from "../../../shared/application/port/intersubsystem/DispatchStaff.port.js";
import type { RecipientResolverPort } from "../port/services/RecipientResolver.port.js";

class RecipientResolverService implements RecipientResolverPort {
    constructor(
        private readonly dispatchDocumentRepo: DispatchDocumentPort,
        private readonly dispatchStaffRepo: DispatchStaffPort,
    ) {}

    async resolveRecipients(input: { designationId: string; unitId: string }) {
        const resolved: Array<{
            staffId: string;
            unitId: string;
            designationId: string;
        }> = [];

        
        const staffs = await this.dispatchStaffRepo.getStaffIdsByDesignationAndUnit({
            designationId: input.designationId,
            unitId: input.unitId,
        });

        for (const staff of staffs) {
            resolved.push({
                staffId: staff.id,
                unitId: input.unitId,
                designationId: input.designationId,
            });
        }
    

        return resolved;
    }
}

export default RecipientResolverService;
