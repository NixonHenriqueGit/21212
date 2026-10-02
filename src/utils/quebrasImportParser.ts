import * as XLSX from 'xlsx';

/**
 * Super-resilient text parser for Quebras/Loss data.
 * Accepts:
 * 1. Valid JSON Array: [ {...}, {...} ]
 * 2. Valid Single JSON Object: { ... }
 * 3. Fragmented JSON array slice with leading/trailing commas or braces (e.g. `},\n{\n "Data": ...\n}`)
 * 4. Concatenated JSON objects `{ ... } { ... }`
 * 5. Single-quote JS/Python dictionary objects `{ 'Data': '...' }`
 * 6. CSV / TSV / Semicolon-delimited / Pipe-delimited text
 */
export function smartParseQuebrasText(rawText: string): any[] {
  if (!rawText || !rawText.trim()) return [];

  const text = rawText.trim();

  // 1. Direct JSON parse
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.filter(item => item && typeof item === 'object');
    if (typeof parsed === 'object' && parsed !== null) return [parsed];
  } catch (_) {}

  // 2. Tokenized / Balanced Brace JSON Extraction (Extremely robust for partial pastes)
  const extractedObjects: any[] = [];
  let depth = 0;
  let startIdx = -1;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (char === '\\' && inString) {
      escapeNext = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{') {
        if (depth === 0) startIdx = i;
        depth++;
      } else if (char === '}') {
        depth--;
        if (depth === 0 && startIdx !== -1) {
          const objStr = text.substring(startIdx, i + 1);
          // Try parse standard JSON object
          try {
            const cleanObjStr = objStr.replace(/,\s*}/g, '}');
            const obj = JSON.parse(cleanObjStr);
            if (obj && typeof obj === 'object') {
              extractedObjects.push(obj);
            }
          } catch (e) {
            // Try relaxed JSON with single quotes
            try {
              const relaxed = objStr
                .replace(/(['"])?([a-zA-Z0-9_À-ÿ\s]+)(['"])?\s*:/g, '"$2":')
                .replace(/'/g, '"')
                .replace(/,\s*}/g, '}');
              const obj = JSON.parse(relaxed);
              if (obj && typeof obj === 'object') {
                extractedObjects.push(obj);
              }
            } catch (_) {}
          }
          startIdx = -1;
        }
      }
    }
  }

  if (extractedObjects.length > 0) {
    return extractedObjects;
  }

  // 3. Clean and wrap in [ ... ]
  let sanitized = text
    .replace(/^[\s,\]\}]+/, '') // Remove leading commas, braces, brackets
    .replace(/[\s,\[\{]+$/, ''); // Remove trailing commas, braces, brackets

  if (sanitized) {
    let candidate = sanitized;
    if (!candidate.startsWith('[')) candidate = '[' + candidate;
    if (!candidate.endsWith(']')) candidate = candidate + ']';
    candidate = candidate.replace(/,\s*([}\]])/g, '$1');

    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) return parsed.filter(item => item && typeof item === 'object');
      if (typeof parsed === 'object' && parsed !== null) return [parsed];
    } catch (_) {}
  }

  // 4. XLSX / CSV string parser
  try {
    const workbook = XLSX.read(text, { type: 'string' });
    const firstSheetName = workbook.SheetNames[0];
    if (firstSheetName) {
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet) as any[];
      if (Array.isArray(rows) && rows.length > 0) {
        return rows;
      }
    }
  } catch (_) {}

  // 5. Line-by-line delimiter parser (CSV, TSV, Semicolon)
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length >= 2) {
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes(';')) delimiter = ';';
    else if (firstLine.includes('|')) delimiter = '|';

    const headers = firstLine.split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
    if (headers.length > 1) {
      const customRows: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
        if (cols.some(Boolean)) {
          const rowObj: Record<string, any> = {};
          headers.forEach((h, idx) => {
            rowObj[h] = cols[idx] !== undefined ? cols[idx] : '';
          });
          customRows.push(rowObj);
        }
      }
      if (customRows.length > 0) return customRows;
    }
  }

  return [];
}
