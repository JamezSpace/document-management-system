import type { DocumentRetentionPolicyPort } from "../../../shared/application/port/intersubsystem/DocumentPolicy.port.js";
import type { RetentionServicePort } from "../../application/ports/services/RetentionService.port.js";
import type { RetentionMetadata } from "../../domain/metadata/Retention.metadata.js";
import ApplicationError from "../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../shared/errors/enum/application.enum.js";

class RetentionService implements RetentionServicePort {
    constructor(private readonly policyPort: DocumentRetentionPolicyPort) {}

    async computeRetention(
        documentTypeId: string,
        retentionStartDate: Date
    ): Promise<RetentionMetadata> {

		const policy = await this.policyPort.getRetentionData(
			documentTypeId,
			retentionStartDate,
		);

		if (!policy) {
			throw new ApplicationError(ApplicationErrorEnum.POLICY_NOT_FOUND, {
				message: `No effective retention policy exists for document type '${documentTypeId}'`,
			});
		}

		const disposalEligibilityDate = this.addCalendarYearsClamped(
			retentionStartDate,
			policy.duration,
		);

        return {
            policyVersion: policy.policyVersion,
            retentionScheduleId: policy.retentionScheduleId,
            retentionStartDate,
            disposalEligibilityDate,
            archivalRequired: policy.archivalRequired
        };
    }

	private addCalendarYearsClamped(source: Date, years: number): Date {
		const result = new Date(source);
		const originalMonth = result.getUTCMonth();
		result.setUTCFullYear(result.getUTCFullYear() + years);

		// JavaScript rolls 29 February into March in non-leap target years.
		// Retention anniversaries instead remain on the target month's last day.
		if (result.getUTCMonth() !== originalMonth) {
			result.setUTCDate(0);
		}

		return result;
	}
}

export default RetentionService;
