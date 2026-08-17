interface StaffClassificationEventsPort {
    staffClassificationCreated(payload: {
        classificationId: string;
    }): Promise<void>;

    staffClassificationMetadataUpdated(payload: {
        classificationId: string;
    }): Promise<void>
}

export type {StaffClassificationEventsPort};