import { unzipSync, strFromU8 } from "fflate";

export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export class ExtractionError extends Error {}

function bytesFromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function cleanText(text: string): string {
  return text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractPdf(bytes: Uint8Array): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return cleanText(Array.isArray(text) ? text.join("\n") : text);
}

function extractDocx(bytes: Uint8Array): string {
  const files = unzipSync(bytes);
  const doc = files["word/document.xml"];
  if (!doc) throw new ExtractionError("This DOCX file could not be read. Try exporting it as a PDF.");
  const xml = strFromU8(doc);
  const text = xml
    .replace(/<w:tab[^>]*\/>/g, " ")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<w:br[^>]*\/>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
  return cleanText(text);
}

export async function extractResumeText(fileName: string, base64: string): Promise<string> {
  const bytes = bytesFromBase64(base64);
  if (bytes.byteLength > MAX_FILE_BYTES) throw new ExtractionError("File is larger than 5MB.");

  const lower = fileName.toLowerCase();
  let text: string;
  if (lower.endsWith(".pdf")) {
    text = await extractPdf(bytes);
  } else if (lower.endsWith(".docx")) {
    text = extractDocx(bytes);
  } else {
    throw new ExtractionError("Only PDF and DOCX resumes are supported.");
  }

  if (text.replace(/\s/g, "").length < 200) {
    throw new ExtractionError(
      "We could not read enough text from this resume. If it is a scanned document, upload a text-based PDF or DOCX instead.",
    );
  }
  return text;
}

/** Generic document text extraction for recruiter uploads (PDF, DOCX, or plain text). */
export async function extractDocumentText(fileName: string, base64: string): Promise<string> {
  const bytes = bytesFromBase64(base64);
  if (bytes.byteLength > MAX_FILE_BYTES) throw new ExtractionError("File is larger than 5MB.");

  const lower = fileName.toLowerCase();
  let text: string;
  if (lower.endsWith(".pdf")) {
    text = await extractPdf(bytes);
  } else if (lower.endsWith(".docx")) {
    text = extractDocx(bytes);
  } else if (/\.(txt|md|eml|csv|rtf|html?)$/.test(lower)) {
    text = cleanText(new TextDecoder().decode(bytes).replace(/<[^>]+>/g, " "));
  } else {
    throw new ExtractionError("Supported files: PDF, DOCX, TXT, MD, EML, CSV, HTML.");
  }

  if (text.replace(/\s/g, "").length < 50) {
    throw new ExtractionError("We could not read enough text from this file. Try a text-based document.");
  }
  return text;
}

export async function hashKey(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
