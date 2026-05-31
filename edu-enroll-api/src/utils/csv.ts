const escapeCsvValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const text = value instanceof Date ? value.toISOString() : String(value);
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
};

export const toCsv = (headers: string[], records: Record<string, unknown>[]): string => {
  const rows = [headers.join(',')];
  for (const record of records) {
    rows.push(headers.map((header) => escapeCsvValue(record[header])).join(','));
  }
  return rows.join('\n');
};

export const parseCsv = (input: string): Record<string, string>[] => {
  const text = input.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(field.trim());
      field = '';
    } else if (char === '\n') {
      row.push(field.trim());
      rows.push(row);
      row = [];
      field = '';
    } else if (char !== '\r') {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field.trim());
    rows.push(row);
  }

  const [headers = [], ...body] = rows.filter((items) => items.some((item) => item));
  const normalizedHeaders = headers.map((header) => header.trim());
  return body.map((items) => {
    const record: Record<string, string> = {};
    normalizedHeaders.forEach((header, index) => {
      record[header] = items[index]?.trim() ?? '';
    });
    return record;
  });
};

export const parseBoolean = (value: unknown, fallback = false): boolean => {
  const text = String(value ?? '').trim().toLowerCase();
  if (!text) return fallback;
  return ['1', 'true', 'yes', 'y', 'active', 'open', 'dang mo', 'đang mở'].includes(text);
};

export const parseNumber = (value: unknown, fallback = 0): number => {
  const normalized = String(value ?? '').replace(/[,\s]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
};
