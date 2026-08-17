interface DispatchRecordEvents {
    documentDispatched(payload: {
        document: {
            id: string;
            type: string;
            title: string;
        };
        sender: {
            id: string;
            name: string;
            officeName: string;
        };
        recipients: string[]
    }): Promise<void>;
}

export type {DispatchRecordEvents};