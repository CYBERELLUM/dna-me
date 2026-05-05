// Client-side parser for research document uploads.
// Extracts text from PDF, Word, Excel, CSV, and plain-text files so the
// content can be injected into the research chat as context.
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import Papa from "papaparse";
import * as XLSX from "xlsx";

// Configure pdfjs worker via CDN (matches installed version)
// Using legacy build for broad browser compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
export const MAX_EXTRACT_CHARS = 60_000; // cap injected text per file

export const ACCEPTED_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".md",
  ".csv",
  ".tsv",
  ".xls",
  ".xlsx",
  ".json",
  ".rtf",
];

export const ACCEPT_ATTR = ACCEPTED_EXTENSIONS.join(",");

export interface ParsedFile {
  filename: string;
  mimeType: string;
  size: number;
  text: string;
  truncated: boolean;
}

const truncate = (text: string): { text: string; truncated: boolean } => {
  if (text.length <= MAX_EXTRACT_CHARS) return { text, truncated: false };
  return { text: text.slice(0, MAX_EXTRACT_CHARS), truncated: true };
};

async function parsePdf(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const out: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((it: any) => ("str" in it ? it.str : "")).filter(Boolean);
    out.push(`--- Page ${i} ---\n${strings.join(" ")}`);
    if (out.join("\n").length > MAX_EXTRACT_CHARS) break;
  }
  return out.join("\n\n");
}

async function parseDocx(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
  return value;
}

async function parseSpreadsheet(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const out: string[] = [];
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    out.push(`--- Sheet: ${sheetName} ---\n${csv}`);
  }
  return out.join("\n\n");
}

async function parseCsv(file: File): Promise<string> {
  const text = await file.text();
  const result = Papa.parse(text, { skipEmptyLines: true });
  const rows = result.data as string[][];
  return rows.map((r) => r.join("\t")).join("\n");
}

async function parseText(file: File): Promise<string> {
  return await file.text();
}

export async function parseFile(file: File): Promise<ParsedFile> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`${file.name} exceeds the 20 MB upload limit`);
  }

  const lower = file.name.toLowerCase();
  let raw = "";

  if (lower.endsWith(".pdf")) {
    raw = await parsePdf(file);
  } else if (lower.endsWith(".docx") || lower.endsWith(".doc")) {
    raw = await parseDocx(file);
  } else if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
    raw = await parseSpreadsheet(file);
  } else if (lower.endsWith(".csv") || lower.endsWith(".tsv")) {
    raw = await parseCsv(file);
  } else if (
    lower.endsWith(".txt") ||
    lower.endsWith(".md") ||
    lower.endsWith(".json") ||
    lower.endsWith(".rtf")
  ) {
    raw = await parseText(file);
  } else {
    // fallback: try as text
    raw = await parseText(file);
  }

  const cleaned = raw.replace(/\s+\n/g, "\n").trim();
  const { text, truncated } = truncate(cleaned);

  return {
    filename: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    text,
    truncated,
  };
}

export function buildContextBlock(files: ParsedFile[]): string {
  if (!files.length) return "";
  const blocks = files.map(
    (f) =>
      `[Attached file: ${f.filename} (${(f.size / 1024).toFixed(1)} KB)${
        f.truncated ? " — truncated" : ""
      }]\n${f.text}`,
  );
  return `\n\n--- Attached Documents ---\n${blocks.join("\n\n")}\n--- End Attachments ---`;
}
