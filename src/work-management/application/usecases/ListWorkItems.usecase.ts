import OpaqueCursor from "../../../documents/application/services/OpaqueCursor.service.js";
import ApplicationError from "../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../shared/errors/enum/application.enum.js";
import type { WorkItemRepositoryPort } from "../ports/WorkItemRepository.port.js";
import type { WorkItemView } from "../types/workItem.type.js";

interface ListWorkItemsInput {
	view: WorkItemView;
	search?: string;
	authorityId?: string;
	status?: string;
	dueFrom?: string;
	dueTo?: string;
	completedFrom?: string;
	completedTo?: string;
	sort?: "newest" | "oldest";
	limit?: number;
	cursor?: string;
}

class ListWorkItemsUseCase {
	constructor(private readonly repository: WorkItemRepositoryPort) {}

	async execute(actorId: string, input: ListWorkItemsInput) {
		const limit = Math.min(Math.max(input.limit ?? 50, 1), 100);
		const cursor = OpaqueCursor.decode(input.cursor, ["view", "at", "id"]);
		if (cursor && cursor.view !== input.view) {
			throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, {
				message: "Cursor belongs to a different work-item view",
			});
		}

		const parseDate = (value: string | undefined, field: string) => {
			if (!value) return undefined;
			const date = new Date(value);
			if (Number.isNaN(date.getTime())) {
				throw new ApplicationError(ApplicationErrorEnum.INCOMPLETE_REQUEST, {
					message: `${field} must be a valid date-time`,
				});
			}
			return date;
		};
		const cursorAt = cursor ? parseDate(cursor.at, "cursor.at") : undefined;
		const dueFrom = parseDate(input.dueFrom, "dueFrom");
		const dueTo = parseDate(input.dueTo, "dueTo");
		const completedFrom = parseDate(input.completedFrom, "completedFrom");
		const completedTo = parseDate(input.completedTo, "completedTo");

		const items = await this.repository.listForActor(actorId, {
			view: input.view,
			sort: input.sort ?? "newest",
			limit: limit + 1,
			...(input.search !== undefined ? { search: input.search.trim() } : {}),
			...(input.authorityId !== undefined ? { authorityId: input.authorityId } : {}),
			...(input.status !== undefined ? { status: input.status } : {}),
			...(dueFrom ? { dueFrom } : {}),
			...(dueTo ? { dueTo } : {}),
			...(completedFrom ? { completedFrom } : {}),
			...(completedTo ? { completedTo } : {}),
			...(cursor && cursorAt ? { cursorAt, cursorId: cursor.id! } : {}),
		});

		const hasNextPage = items.length > limit;
		const pageItems = items.slice(0, limit);
		const last = pageItems.at(-1);
		const cursorDate = last && (last.completedAt ?? last.returnedAt ?? last.assignedAt);

		return {
			items: pageItems,
			pageInfo: {
				hasNextPage,
				nextCursor: hasNextPage && last && cursorDate
					? OpaqueCursor.encode({ view: input.view, at: cursorDate.toISOString(), id: last.id })
					: null,
			},
		};
	}
}

export default ListWorkItemsUseCase;
export type { ListWorkItemsInput };
