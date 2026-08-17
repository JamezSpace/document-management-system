import type { ResolutionStrategy } from "../enum/ResolutionStrategy.enum.js";

interface WorkflowStepPayload {
    stepOrder: number;
    role: string;
    resolutionStrategy: ResolutionStrategy;
}

class WorkflowStep {
    stepOrder: number;
    role: string;
    resolutionStrategy: ResolutionStrategy;

    constructor(payload: WorkflowStepPayload){
        this.stepOrder = payload.stepOrder;
        this.role = payload.role;
        this.resolutionStrategy = payload.resolutionStrategy;
    }
}

export default WorkflowStep;