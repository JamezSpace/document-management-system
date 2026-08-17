import _ from "lodash";
import { NotificationPreference } from "../enum/NotificationPreference.enum.js";

export interface TemplateRenderResult {
    header: string;
    message: string;
}

type TemplateBuilder = (payload: Record<string, any>) => TemplateRenderResult;

// unified map of domain events across distinct channels
const TEMPLATE_REGISTRY: Record<
    string,
    Record<NotificationPreference, TemplateBuilder>
> = {
    document_dispatched: {
        [NotificationPreference.IN_APP]: (payload) => ({
            header: "Internal Correspondence Dispatched",
            
            message: `Correspondence [${_.startCase(payload.document?.title) || "UNTITLED"}] has been routed to your desk workspace by ${payload.sender?.name || "an Officer"} (${_.startCase(payload.sender?.officeName) || "Registry"}).`,
        }),
        [NotificationPreference.EMAIL]: (payload) => ({
            header: `NexusFons: Internal Handoff Notification [${_.startCase(payload.document?.title) || "UNTITLED"}]`,

            message: `Dear Colleague,\n\nYou have received a formal internal dispatch for correspondence: "${_.startCase(payload.document?.title) || "Untitled Document"}".\n\nOriginating Desk: ${_.startCase(payload.sender?.officeName) || "Administrative Registry"}\n\nPlease log into the NexusFons Digital Office to review and act on this incoming assignment.\n\nThis is an automated institutional governance notice.`,
        }),
    },
    document_submitted: {
        [NotificationPreference.IN_APP]: (payload) => ({
            header: "Record Locked for Review",
            message: `Correspondence [${payload.documentCode || "UNTITLED"}] has been finalized and secured within the official evaluation pipeline.`,
        }),
        [NotificationPreference.EMAIL]: (payload) => ({
            header: `NexusFons: Formal Review Required [${payload.documentCode || "RECORD"}]`,
            message: `Attention Reviewing Officer,\n\nCorrespondence ${payload.documentCode || "Record"} has been locked and submitted for formal executive verification.\n\nWorkflow Hierarchical Threshold: Level ${payload.hierarchyLevelTrigger || 1}\n\nPlease process this transaction in your pending clearance queue accordingly.`,
        }),
    },
    business_function_created: {
        [NotificationPreference.IN_APP]: (payload) => ({
            header: "New Business Function Established",
            message: `A new administrative business function execution scheme "${payload.inAppSubjectName || "Untitled Schema"}" has been created.`,
        }),
        [NotificationPreference.EMAIL]: (payload) => ({
            header: `NexusFons: Institutional Business Function Created - ${payload.inAppSubjectName || "System Class"}`,
            message: `An official system notification confirming that a new business function architype "${payload.inAppSubjectName || "Untitled"}" was deployed to the active registry schema configuration.\n\nExecuted at: ${new Date().toUTCString()}`,
        }),
    },
    workflow_tasks_assigned: {
        [NotificationPreference.IN_APP]: (payload) => ({
            header: "Action Required: Task Assigned",
            message: `You have an active workflow task awaiting executive execution: "${payload.inAppSubjectName || "Untitled Action Item"}".`,
        }),
        [NotificationPreference.EMAIL]: (payload) => ({
            header: `NexusFons: Immediate Action Required - Workflow Task Assignment`,
            message: `Attention Officer,\n\nA pending task requiring your professional clearance has been registered under your profile assignment: "${payload.inAppSubjectName || "Untitled Task"}"\n\nPlease log into the digital workspace environment immediately to avoid processing stale bottlenecks.\n\nNexusFons Registry & Compliance Unit.`,
        }),
    },
};

export class NotificationTemplateEngine {
    static render(
        eventType: string,
        channel: NotificationPreference,
        payload: Record<string, any>,
    ): TemplateRenderResult {
        const eventTemplates = TEMPLATE_REGISTRY[eventType.toLowerCase()];

        if (!eventTemplates || !eventTemplates[channel]) {
            // Fallback object safely fulfills the strict TemplateRenderResult signature contract
            return {
                header: "System Governance Alert",
                message: `System notice regarding a state transaction event [${eventType}]. Please review your active workspace audit log trailing metrics.`,
            };
        }

        return eventTemplates[channel](payload);
    }
}