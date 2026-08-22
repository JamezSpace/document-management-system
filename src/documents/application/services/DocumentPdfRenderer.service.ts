import type Document from "../../domain/entities/document/Document.js";

class DocumentPdfRenderer {
	static render(document: Document, watermarkText: string | null): Buffer {
		const source = this.extractText(document.getCurrentVersion()?.contentDelta);
		const lines = this.wrap([document.title, document.referenceNumber ?? "", "", source].join("\n"), 90);
		const pageLines = 42;
		const pages = Array.from({ length: Math.max(1, Math.ceil(lines.length / pageLines)) }, (_, index) =>
			lines.slice(index * pageLines, (index + 1) * pageLines),
		);
		return this.buildPdf(pages, watermarkText);
	}

	private static extractText(value: unknown): string {
		if (!value) return "";
		if (typeof value === "string") return value;
		if (Array.isArray(value)) return value.map((item) => this.extractText(item)).join("");
		if (typeof value === "object") {
			const record = value as Record<string, unknown>;
			if (Array.isArray(record.ops)) return record.ops.map((op) => this.extractText(op)).join("");
			if (typeof record.insert === "string") return record.insert;
			if (record.content !== undefined) return this.extractText(record.content);
		}
		return "";
	}

	private static wrap(value: string, width: number) {
		const output: string[] = [];
		for (const raw of value.replace(/\r/g, "").split("\n")) {
			let line = raw.trimEnd();
			if (!line) { output.push(""); continue; }
			while (line.length > width) {
				let split = line.lastIndexOf(" ", width);
				if (split < width / 2) split = width;
				output.push(line.slice(0, split));
				line = line.slice(split).trimStart();
			}
			output.push(line);
		}
		return output;
	}

	private static buildPdf(pages: string[][], watermark: string | null) {
		const objects: string[] = [];
		const add = (body: string) => { objects.push(body); return objects.length; };
		const catalogId = add("");
		const pagesId = add("");
		const fontId = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
		const pageIds: number[] = [];
		for (const lines of pages) {
			const commands = ["BT", "/F1 11 Tf", "50 760 Td"];
			for (const line of lines) commands.push(`(${this.escape(line)}) Tj`, "0 -16 Td");
			commands.push("ET");
			if (watermark) commands.push("0.65 g", "BT", "/F1 9 Tf", "40 24 Td", `(${this.escape(watermark)}) Tj`, "ET", "0 g");
			const stream = commands.join("\n");
			const contentId = add(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
			pageIds.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`));
		}
		objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
		objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
		let pdf = "%PDF-1.4\n";
		const offsets = [0];
		objects.forEach((body, index) => {
			offsets.push(Buffer.byteLength(pdf));
			pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
		});
		const xref = Buffer.byteLength(pdf);
		pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
		for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
		pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
		return Buffer.from(pdf, "latin1");
	}

	private static escape(value: string) {
		return value.replace(/[^\x20-\x7E]/g, "?").replace(/([\\()])/g, "\\$1");
	}
}

export default DocumentPdfRenderer;
