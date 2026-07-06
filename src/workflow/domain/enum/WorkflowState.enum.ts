/**
 * This enumerates all the valid states of a workflow instance. Refer to the "state machine" for more information on this.
 */
enum WorkflowState {
    NOT_STARTED  = "NOT STARTED",
    ACTIVE = "ACTIVE",
    WAITING = "WAITING",
    ADVANCED = "ADVANCED",
    COMPLETED = "COMPLETED",
    STALLED = "STALLED"
}

export default WorkflowState;