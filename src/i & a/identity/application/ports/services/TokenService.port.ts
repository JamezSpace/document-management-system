interface TokenServicePort {
    generate(inviteId: string, entity: 'staff' | 'unit'): string

    validateToken(token: string): boolean
}

export type {TokenServicePort};