export interface LineLengthViolation {
  lineIndex: number;
  raw: string;
  contentLength: number;
}

export function checkLineLengths(
  content: string,
  maxChars = 40,
): LineLengthViolation[] {
  return content.split("\n").reduce<LineLengthViolation[]>((acc, raw, i) => {
    const stripped = raw.replace(/\[([^\]]+)\]/g, "");
    if (stripped.length > maxChars) acc.push({ lineIndex: i, raw, contentLength: stripped.length });
    return acc;
  }, []);
}
