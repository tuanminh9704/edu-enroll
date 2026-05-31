const DEFAULT_PASS_THRESHOLD = 50;

const LEVEL_RULES: Record<string, Array<{ min: number; level: string }>> = {
  english: [
    { min: 85, level: 'C1' },
    { min: 70, level: 'B2' },
    { min: 55, level: 'B1' },
    { min: 40, level: 'A2' },
    { min: 0, level: 'A1' },
  ],
  japanese: [
    { min: 85, level: 'N2' },
    { min: 70, level: 'N3' },
    { min: 55, level: 'N4' },
    { min: 0, level: 'N5' },
  ],
  korean: [
    { min: 75, level: 'K3' },
    { min: 50, level: 'K2' },
    { min: 0, level: 'K1' },
  ],
  chinese: [
    { min: 75, level: 'HSK5' },
    { min: 50, level: 'HSK3' },
    { min: 0, level: 'HSK1' },
  ],
  french: [
    { min: 80, level: 'FR_B2' },
    { min: 65, level: 'FR_B1' },
    { min: 45, level: 'FR_A2' },
    { min: 0, level: 'FR_A1' },
  ],
};

export const calculateExamResult = (score: number, language?: string, explicitLevel?: string, threshold = DEFAULT_PASS_THRESHOLD) => {
  const passThreshold = Number.isFinite(threshold) ? threshold : DEFAULT_PASS_THRESHOLD;
  const normalizedLanguage = (language || 'english').toLowerCase();
  const levelRules = LEVEL_RULES[normalizedLanguage] || LEVEL_RULES.english;
  const level = explicitLevel || levelRules.find((rule) => score >= rule.min)?.level || levelRules[levelRules.length - 1].level;
  const passed = score >= passThreshold;

  return {
    level_passed: level,
    pass_status: passed ? 'passed' as const : 'failed' as const,
    pass_threshold: passThreshold,
  };
};
