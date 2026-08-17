import type { FastifyReply, FastifyRequest } from "fastify";

interface MiddlewarePort {
    validateUserIsAuthenticated(request: FastifyRequest, reply: FastifyReply) : Promise<void>;
}

export type {MiddlewarePort};