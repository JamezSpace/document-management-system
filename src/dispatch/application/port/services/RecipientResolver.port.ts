interface RecipientResolverPort {
    resolveRecipients(input: {
        designationId: string;
        unitId: string;
    }): Promise<Array<{
        staffId: string;
        unitId: string;
        designationId: string;
    }>>;
}

export type { RecipientResolverPort };
