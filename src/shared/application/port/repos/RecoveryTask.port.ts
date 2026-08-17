import type { RecoveryTaskPayload } from "../../../domain/RecoveryTask.js";
import type RecoveryTask from "../../../domain/RecoveryTask.js";

interface RecoveryTaskRepositoryPort {
    save(payload: RecoveryTaskPayload): Promise<RecoveryTask>;

    findById(rcvTaskId: string): Promise<RecoveryTask | null>;

    fetchAll(): Promise<RecoveryTask[]>

    updateRecoveryTask(rcvTaskId: string, changesToMake: Partial<RecoveryTask>): Promise<RecoveryTask>
}

export type {RecoveryTaskRepositoryPort};