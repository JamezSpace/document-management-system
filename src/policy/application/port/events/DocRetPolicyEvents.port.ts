interface DocumentRetentionPolicyEventsPort {
    documentRetentionPolicyCreated(payload: {
        policyId: string,
        actorId: string;
    }): Promise<void>;
}

export type {DocumentRetentionPolicyEventsPort}