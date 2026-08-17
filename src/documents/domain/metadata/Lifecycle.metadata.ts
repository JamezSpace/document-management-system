import type { LifecycleState } from "../enum/lifecycleState.enum.js";

interface LifecycleMetadata {
  currentState: LifecycleState;
  stateEnteredAt: Date;
  stateEnteredBy: string; // actorId or roleId depending on your model
}

export type { LifecycleMetadata };

