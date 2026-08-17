import type { DocumentRetentionPolicyPort } from "../../../shared/application/port/intersubsystem/DocumentPolicy.port.js";
import type { RetentionServicePort } from "../../application/ports/services/RetentionService.port.js";
import type { RetentionMetadata } from "../../domain/metadata/Retention.metadata.js";

class RetentionService implements RetentionServicePort {
    constructor(private readonly policyPort: DocumentRetentionPolicyPort) {}

    async computeRetention(
        documentTypeId: string,
        retentionStartDate: Date
    ): Promise<RetentionMetadata> {

        const policy = await this.policyPort.getRetentionData(documentTypeId);

        const disposalEligibilityDate = new Date(retentionStartDate);
        disposalEligibilityDate.setFullYear(
            disposalEligibilityDate.getFullYear() + policy.duration
        );

        return {
            policyVersion: policy.policyVersion,
            retentionScheduleId: policy.retentionScheduleId,
            retentionStartDate,
            disposalEligibilityDate,
            archivalRequired: policy.archivalRequired
        };
    }
}

export default RetentionService;