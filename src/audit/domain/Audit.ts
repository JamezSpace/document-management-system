import type { AuditOutcome, AuditActorType, AuditActorId } from "./AuditTypes.js";

interface AuditDTO {
  auditId: string;

  // Who caused the event
  actorId: AuditActorId;
  actorType: AuditActorType;

  // What happened
  event: string;    
  action: string;   // SUBMIT, APPROVE, REJECT

  // What was affected
  subjectType: "DOCUMENT" | "WORKFLOW_TASK" | "WORKFLOW";
  subjectId: string;

  // Result
  outcome: AuditOutcome;
  reason?: string; // Optional (e.g. authorization denied)

  // Correlation
  correlationId?: string;   // Links multiple audits in one flow
}


class Audit {
  readonly auditId: string;
  readonly actorId: string;
  readonly actorType: "USER" | "SYSTEM";
  readonly eventType: string;
  readonly action: string;
  readonly subjectType: string;
  readonly subjectId: string;
  readonly outcome: AuditOutcome;
  readonly reason?: string | null;
  readonly correlationId?: string | null;
  readonly createdAt: Date;

  constructor(dto: AuditDTO) {
    this.auditId = dto.auditId;
    this.actorId = dto.actorId;
    this.actorType = dto.actorType;
    this.eventType = dto.event;
    this.action = dto.action;
    this.subjectType = dto.subjectType;
    this.subjectId = dto.subjectId;
    this.outcome = dto.outcome;
    this.reason = dto.reason ?? null;
    this.correlationId = dto.correlationId ?? null;
    this.createdAt = new Date();
  }
}
