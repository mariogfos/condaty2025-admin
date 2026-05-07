export type ParsedExpenseDescription = {
  raw: string;
  concept: string;
  holderName: string | null;
  accountNumber: string | null;
  bankName: string | null;
  documentId: string | null;
  reference: string | null;
  hasStructuredDetails: boolean;
};

const normalizeText = (value?: string | null) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

const extractField = (source: string, label: string, nextLabels: string[]) => {
  if (!source) return null;

  const nextPattern = nextLabels.length
    ? `(?=\\s+(?:${nextLabels.join("|")})\\s*:|$)`
    : "$";
  const regex = new RegExp(`${label}\\s*:\\s*(.*?)${nextPattern}`, "i");
  const match = source.match(regex);

  return normalizeText(match?.[1] || null) || null;
};

export const parseExpenseDescription = (
  description?: string | null,
): ParsedExpenseDescription => {
  const raw = normalizeText(description);

  if (!raw) {
    return {
      raw: "",
      concept: "-/-",
      holderName: null,
      accountNumber: null,
      bankName: null,
      documentId: null,
      reference: null,
      hasStructuredDetails: false,
    };
  }

  const quotedMatch = raw.match(/^(.*?)\s*"([^"]+)"\s*(.*)$/);
  const concept = normalizeText(quotedMatch?.[1] || raw) || raw;
  const detailsBlock = normalizeText(quotedMatch?.[2] || "");
  const reference = normalizeText(quotedMatch?.[3] || "") || null;

  const holderName = extractField(detailsBlock, "Nombre del titular", [
    "cuenta",
    "banco",
    "ci",
  ]);
  const accountNumber = extractField(detailsBlock, "cuenta", ["banco", "ci"]);
  const bankName = extractField(detailsBlock, "banco", ["ci"]);
  const documentId = extractField(detailsBlock, "ci", []);

  return {
    raw,
    concept,
    holderName,
    accountNumber,
    bankName,
    documentId,
    reference,
    hasStructuredDetails: Boolean(
      detailsBlock ||
        reference ||
        holderName ||
        accountNumber ||
        bankName ||
        documentId,
    ),
  };
};

export const getExpenseDescriptionSummary = (description?: string | null) =>
  parseExpenseDescription(description).concept;
