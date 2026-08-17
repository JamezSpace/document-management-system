/**
 * This enum holds the lifecycle states for documents. Note that it is in the past tense, this is because, the documents this enumerates the state the document is, at the moment. It is different from the action!
 * 
 * E.g. the action is 'APRROVE', the lifecycle state of the document after the action is 'APPROVED'.
 */
enum LifecycleState {
  DRAFT = "draft",
  IN_REVIEW = "in_review",
  ACTIVE = "active",
  DECLARED_RECORD = "declared_record",
  ARCHIVED = "archived",
  CANCELLED = "cancelled", // The "Soft Delete" state for Drafts/Reviews
  DISPOSED = "disposed"    // The "Legal End-of-Life" state
}

export {
    LifecycleState
}