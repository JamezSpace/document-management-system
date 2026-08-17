import type { DispatchDocumentPort } from "../../../shared/application/port/intersubsystem/DispatchDocument.port.js";
import type { DispatchStaffPort } from "../../../shared/application/port/intersubsystem/DispatchStaff.port.js";
import type { IdGeneratorPort } from "../../../shared/application/port/services/IdGenerator.port.js";
import type { TransactionManager } from "../../../shared/application/port/TransactionManager.port.js";
import ApplicationError from "../../../shared/errors/ApplicationError.error.js";
import { ApplicationErrorEnum } from "../../../shared/errors/enum/application.enum.js";
import DispatchRecord from "../../domain/entities/DispatchRecord.js";
import InboxEntry from "../../domain/entities/InboxEntry.js";
import { DispatchStatus } from "../../domain/enum/dispatchStatus.enum.js";
import { DispatchType } from "../../domain/enum/dispatchType.enum.js";
import { InboxEntryStatus } from "../../domain/enum/inboxEntryStatus.enum.js";
import type { DispatchRecordEvents } from "../port/events/DispatchRecordEvents.port.js";
import type { DispatchRecordRepositoryPort } from "../port/repos/DispatchRecordRepository.port.js";
import type { InboxEntryRepositoryPort } from "../port/repos/InboxEntryRepository.port.js";
import type { RecipientResolverPort } from "../port/services/RecipientResolver.port.js";

class SendCorrespondenceUseCase {
	constructor(
		private readonly idGenerator: IdGeneratorPort,
		private readonly dispatchDocumentPort: DispatchDocumentPort,
		private readonly dispatchRecordRepo: DispatchRecordRepositoryPort,
		private readonly dispatchStaffRepo: DispatchStaffPort,
		private readonly inboxRepo: InboxEntryRepositoryPort,
		private readonly recipientResolver: RecipientResolverPort,
		private readonly dispatchEvents: DispatchRecordEvents,
		private readonly transactionManager: TransactionManager,
	) {}

	async execute(input: { docId: string; actorId: string }) {
		const result = await this.transactionManager.execute(
			async (transactionInstance) => {
				const doc = await this.dispatchDocumentPort.getDocumentById(
					input.docId,
					transactionInstance,
				);

				if (!doc)
					throw new ApplicationError(
						ApplicationErrorEnum.DOCUMENT_NOT_FOUND,
						{ message: "Document not found for dispatch" },
					);

				if (!doc.isDispatchable())
					throw new ApplicationError(
						ApplicationErrorEnum.NOT_ALLOWED,
						{ message: "Document is not valid to be dispatched" },
					);

				const senderDetails =
					await this.dispatchStaffRepo.getStaffDetailsById(
						input.actorId,
						transactionInstance,
					);

				const addressees = doc.addressees ?? [];

				if (addressees.length === 0) {
					throw new ApplicationError(
						ApplicationErrorEnum.NOT_ALLOWED,
						{ message: "Document has no addressees to dispatch to" },
					);
				}

                console.log(addressees)

				const dispatchRecords = addressees.map(
					(addressee) => 
						new DispatchRecord({
							id: `D-RCD-${this.idGenerator.generate()}`,
							documentId: doc.id,
							senderStaffId: input.actorId,
							senderDesignationId: senderDetails.designationId,
							senderUnitId: senderDetails.unitId,
							recipientDesignationId:
								addressee.addressedToDesignationId,
							recipientUnitId: addressee.recipientUnitId,
							dispatchType: DispatchType.DIRECT,
							status: DispatchStatus.PENDING,
							dispatchedAt: new Date(),
							parentDispatchId: null,
						})
				);

				const savedDispatches = await this.dispatchRecordRepo.saveMany(
					dispatchRecords,
					transactionInstance,
				);

				const recipients: Array<{
					staffId: string;
					unitId: string;
					designationId: string;
				}> = [];

				const inboxEntries: InboxEntry[] = [];

				for (let index = 0; index < addressees.length; index++) {
					const addressee = addressees[index]!;
					const dispatch = savedDispatches[index]!;

					const resolvedRecipients =
						await this.recipientResolver.resolveRecipients({
							designationId: addressee.addressedToDesignationId,
							unitId: addressee.recipientUnitId,
						});

					if (resolvedRecipients.length === 0)
						throw new ApplicationError(
							ApplicationErrorEnum.NOT_ALLOWED,
							{
								message: `No recipients resolved for addressee ${addressee.addressedToDesignationId}`,
							},
						);

					recipients.push(...resolvedRecipients);

					for (const recipient of resolvedRecipients) {
						inboxEntries.push(
							new InboxEntry({
								id: `INBX-${this.idGenerator.generate()}`,
								dispatchId: dispatch.id,
								documentId: doc.id,
								staffId: recipient.staffId,
								designationId: recipient.designationId,
								unitId: recipient.unitId,
								status: InboxEntryStatus.UNREAD,
								receivedAt: new Date(),
							}),
						);
					}
				}

				await this.inboxRepo.saveMany(
					inboxEntries,
					transactionInstance,
				);

				return {
					dispatchRecords: savedDispatches,
					documentDispatched: doc,
					sender: senderDetails,
					recipients: recipients.map((r) => r.staffId),
				};
			},
		);

		await this.dispatchEvents.documentDispatched({
			document: {
				id: result.documentDispatched.id,
				type: result.documentDispatched.classification.documentTypeId,
				title: result.documentDispatched.title,
			},
			sender: {
				id: input.actorId,
                name: result.sender.fullName,
                officeName: result.sender.officeName
			},
			recipients: result.recipients,
		});

		return result.dispatchRecords;
	}
}

export default SendCorrespondenceUseCase;
