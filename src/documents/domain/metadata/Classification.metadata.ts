import type { SensitivityLevel } from "../enum/sensitivityLevel.enum.js";

interface ClassificationMetadata {
  sensitivity: SensitivityLevel;
  functionCodeId: string;
  documentTypeId: string;

  classifiedBy: string;
  classifiedAt: Date;

  lastReclassifiedAt?: Date | null;
  lastReclassifiedBy?: string | null;
}

export type { ClassificationMetadata };

