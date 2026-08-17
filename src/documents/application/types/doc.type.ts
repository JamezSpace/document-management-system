import type { LifecycleActions } from "../../domain/enum/lifecycleActions.enum.js";
import type { AddresseeMetadata } from "../../domain/metadata/Addressee.metadata.js";
import type { ClassificationMetadata } from "../../domain/metadata/Classification.metadata.js";
import type { CorrespondenceMetadata } from "../../domain/metadata/Correspondence.metadata.js";

interface ClassificationMetadataWithFunctionCode extends ClassificationMetadata{
    functionCode: string;
}

interface CorrespondenceMetadataWithSubjectCode extends CorrespondenceMetadata{
    subjectCode: string;
}

interface DocumentTypeForCreation {
    title: string;
    ownerId: string;
    action: LifecycleActions;
    
    classification: ClassificationMetadataWithFunctionCode;
    correspondence: CorrespondenceMetadataWithSubjectCode;
    
    // addressees
    addressees: AddresseeMetadata[]
}

export type { DocumentTypeForCreation };

