import type { FastifyInstance } from "fastify";
import workspaceRoutes from "./api/routes/workspace.route.js";
import WorkspaceController from "./api/contoller/WorkspaceController.js";

export default async function OrchestrationSubsystem(fastify: FastifyInstance) {
    const workspaceController = new WorkspaceController();

    await fastify.register(workspaceRoutes, {
        controller: workspaceController
    })
}