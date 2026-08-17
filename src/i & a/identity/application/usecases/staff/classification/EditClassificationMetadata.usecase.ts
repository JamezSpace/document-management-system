import StaffClassification from "../../../../domain/entities/staff/StaffClassification.js";
import type { StaffClassificationEventsPort } from "../../../ports/events/staff/StaffclassificationEvents.port.js";
import type { StaffClassificationRepositoryPort } from "../../../ports/repos/entities/staff/StaffClassificationRepository.port.js";

interface ModifyStaffClassificationPayload {
  capabilityClass?: string;
  authorityLevel?: number;
}

class EditStaffClassificationMetadataUseCase {
  constructor(
    private readonly staffClassEvents: StaffClassificationEventsPort,
    private readonly staffClassRepo: StaffClassificationRepositoryPort
  ) {}

  async editClassificationMetadata(
    classificationId: string,
    updates: ModifyStaffClassificationPayload
  ): Promise<StaffClassification> {

    const existing = await this.staffClassRepo.findMostRecentClassificationById(classificationId)

    if (!existing) {
      throw new Error("Staff classification not found");
    }

    if (existing.isClosed()) {
      throw new Error("Cannot modify a closed classification");
    }

    const updated = new StaffClassification({
      ...existing,
      capabilityClass: updates.capabilityClass ?? existing.capabilityClass,
      authorityLevel: updates.authorityLevel ?? existing.authorityLevel,
      updatedAt: new Date(),
    });

    const newStaffClassification = await this.staffClassRepo.save(updated);

    if(newStaffClassification)
        await this.staffClassEvents.staffClassificationMetadataUpdated({classificationId})

    return updated;
  }
}

export default EditStaffClassificationMetadataUseCase;