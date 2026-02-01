import type { DataFormat } from '../../shared/types/context';

/**
 * Attempts to extract structured JSON from raw agent stdout text.
 * Looks for JSON blocks in common formats:
 * - Fenced code blocks (```json ... ```)
 * - Raw JSON objects/arrays
 */
export function parseAgentOutput(raw: string): { format: DataFormat; content: string } {
  // Try fenced JSON block
  const fencedMatch = raw.match(/```json\s*\n([\s\S]*?)\n\s*```/);
  if (fencedMatch) {
    const candidate = fencedMatch[1].trim();
    if (isValidJson(candidate)) {
      return { format: 'json', content: candidate };
    }
  }

  // Try raw JSON (first { to last } or first [ to last ])
  const trimmed = raw.trim();
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    if (isValidJson(trimmed)) {
      return { format: 'json', content: trimmed };
    }
  }

  // Check for markdown indicators
  if (trimmed.startsWith('#') || trimmed.includes('\n##') || trimmed.includes('\n- ')) {
    return { format: 'markdown', content: trimmed };
  }

  return { format: 'text', content: trimmed };
}

function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}
