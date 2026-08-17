import type { TransactionContext } from "../../../../../../../shared/infrastructure/persistence/primary/postgres.js";
import type StaffClassification from "../../../../../domain/entities/staff/StaffClassification.js";

interface StaffClassificationRepositoryPort {
    save(
        staffClassification: StaffClassification,
        tx?: TransactionContext,
    ): Promise<StaffClassification>;

    updateStaffClassification(classificationId: string, changesToMake: Partial<StaffClassification>): Promise<StaffClassification>;

    findMostRecentClassificationById(classificationId: string): Promise<StaffClassification | null>;
}

export type { StaffClassificationRepositoryPort };

