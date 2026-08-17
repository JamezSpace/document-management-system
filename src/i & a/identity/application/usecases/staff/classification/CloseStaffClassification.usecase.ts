import StaffClassification from "../../../../domain/entities/staff/StaffClassification.js";
import type { StaffClassificationEventsPort } from "../../../ports/events/staff/StaffclassificationEvents.port.js";
import type { StaffClassificationRepositoryPort } from "../../../ports/repos/entities/staff/StaffClassificationRepository.port.js";

class CloseStaffClassificationUseCase {
  constructor(
    private readonly staffClassEvents: StaffClassificationEventsPort,
    private readonly staffClassRepo: StaffClassificationRepositoryPort,
  ) {}

  async closeStaffClassification(
    classificationId: string,
    closingDate: Date
  ): Promise<StaffClassification> {

    const existing = await this.staffClassRepo.findMostRecentClassificationById(classificationId);

    if (!existing) {
      throw new Error("Staff classification not found");
    }

    if (existing.isClosed()) {
      throw new Error("Classification already closed");
    }

    if (closingDate < existing.effectiveFrom) {
      throw new Error("Closing date cannot be before effectiveFrom");
    }

    const closedStaffclassification = existing.close(closingDate);

    const staffClassification = await this.staffClassRepo.save(closedStaffclassification);

    if(staffClassification)
        await this.staffClassEvents.staffClassificationMetadataUpdated({classificationId})


    return staffClassification;
  }
}

export default CloseStaffClassificationUseCase;