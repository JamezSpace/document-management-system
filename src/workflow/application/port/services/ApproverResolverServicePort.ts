import type { DocumentView } from "../../../../shared/application/port/intersubsystem/WorkflowDocument.port.js";
import type { ResolutionStrategy } from "../../../domain/enum/ResolutionStrategy.enum.js";

interface ApproverResolverServicePort {
	resolve(
		document: DocumentView,
		role: string,
		strategy: ResolutionStrategy,
	): Promise<string[]>;
}

export type { ApproverResolverServicePort };

