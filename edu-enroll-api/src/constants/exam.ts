export const FIXED_EXAM_DATES = [
  '2026-06-15',
  '2026-07-15',
  '2026-08-15',
  '2026-09-15',
  '2026-10-15',
  '2026-11-15',
];

export const isFixedExamDate = (value: string) => FIXED_EXAM_DATES.includes(value);

export const toExamDateKey = (date: Date | string) => {
  const parsed = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(parsed.getTime())) return '';
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
