import TextRecognition from '@react-native-ml-kit/text-recognition';
import type { FuelPriceInput, FuelType } from '../types';

export type OcrOutput = {
  prices: FuelPriceInput;
  confidence: number; // 0..1
  rawText: string;
  error?: string;
};

type FuelEvidence = {
  value: number;
  score: number;
  source: 'label' | 'label_lookahead' | 'fallback_order';
  lineIndex?: number;
};

type LineInfo = {
  original: string;
  normalized: string;
  lineIndex: number;
  prices: number[];
  fuelHits: FuelType[];
};

const FUEL_ORDER: FuelType[] = ['regular', 'premium', 'diesel'];

const fuelPatterns: Record<FuelType, RegExp[]> = {
  regular: [
    /\bregular\b/i,
    /\breg\b/i,
    /\bunleaded\b/i,
    /\bextra\b/i,
    /\becopais\b/i,
  ],
  premium: [
    /\bpremium\b/i,
    /\bprem\b/i,
    /\bsuper\b/i,
  ],
  diesel: [
    /\bdiesel\b/i,
    /\bdsl\b/i,
    /\bgasoil\b/i,
    /\bgasoleo\b/i,
  ],
};

// MEJORA 1: Soporta 2 o 3 decimales y admite letras que el OCR confunde frecuentemente con números
const PRICE_REGEX = /\b(?:usd\s*)?\$?\s*([0-9OoBbSsZz]{1,2})\s*([.,'`-])\s*([0-9OoBbSsZz]{2,3})\b/gi;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const formatError = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};

const stripDiacritics = (value: string): string =>
  value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');

const normalizeText = (value: string): string =>
  stripDiacritics(value)
    .replace(/\u00A0/g, ' ')
    .replace(/[|¡]/g, 'i')
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const normalizeForPriceScan = (value: string): string =>
  normalizeText(value).replace(/\s*([.,])\s*/g, '$1');

// MEJORA 2: Limpieza de caracteres leídos erróneamente en pantallas LED
const sanitizeOcrNumber = (str: string): string => {
  return str
    .toUpperCase()
    .replace(/[O]/g, '0')
    .replace(/[B]/g, '8')
    .replace(/[S]/g, '5')
    .replace(/[Z]/g, '2');
};

const extractPriceCandidates = (line: string): number[] => {
  const candidates: number[] = [];
  const cleanLine = normalizeForPriceScan(line);

  for (const match of cleanLine.matchAll(PRICE_REGEX)) {
    // Aplicamos la limpieza solo sobre los bloques que ya pasaron la validación del Regex
    const integerPart = sanitizeOcrNumber(match[1]);
    const decimalPart = sanitizeOcrNumber(match[3]);
    
    const value = Number.parseFloat(`${integerPart}.${decimalPart}`);
    if (Number.isFinite(value)) {
      candidates.push(value);
    }
  }

  return [...new Set(candidates)];
};

const detectFuelHits = (line: string): FuelType[] => {
  const normalized = normalizeText(line);

  // MEJORA 3: Prioridad de Diésel. Evita que "DIESEL PREMIUM" se asigne a gasolina premium.
  if (fuelPatterns.diesel.some((pattern) => pattern.test(normalized))) {
    return ['diesel'];
  }

  return FUEL_ORDER.filter((fuelType) =>
    fuelPatterns[fuelType].some((pattern) => pattern.test(normalized)),
  );
};

const buildLineInfo = (text: string): LineInfo[] =>
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((original, lineIndex) => ({
      original,
      normalized: normalizeForPriceScan(original),
      lineIndex,
      prices: extractPriceCandidates(original),
      fuelHits: detectFuelHits(original),
    }));

const setBestEvidence = (
  evidence: Partial<Record<FuelType, FuelEvidence>>,
  fuelType: FuelType,
  next: FuelEvidence,
) => {
  const current = evidence[fuelType];
  if (!current || next.score > current.score) {
    evidence[fuelType] = next;
  }
};

const assignFromLabels = (
  lines: LineInfo[],
): Partial<Record<FuelType, FuelEvidence>> => {
  const evidence: Partial<Record<FuelType, FuelEvidence>> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const fuelType of line.fuelHits) {
      for (let offset = 0; offset <= 2; offset++) {
        const candidateLine = lines[i + offset];
        if (!candidateLine) continue;

        const value = candidateLine.prices[0];
        if (value == null) continue;

        const score = offset === 0 ? 0.98 : offset === 1 ? 0.90 : 0.82;

        setBestEvidence(evidence, fuelType, {
          value,
          score,
          source: offset === 0 ? 'label' : 'label_lookahead',
          lineIndex: candidateLine.lineIndex,
        });

        break;
      }
    }
  }

  return evidence;
};

const assignByOrder = (
  lines: LineInfo[],
  evidence: Partial<Record<FuelType, FuelEvidence>>,
) => {
  const allCandidates = [...new Set(lines.flatMap((line) => line.prices))].sort((a, b) => a - b);
  if (allCandidates.length < 3) return evidence;

  // MEJORA 4: Orden lógico real. 
  // 0 = Más barato, 1 = Medio, 2 = Más caro.
  const desiredIndex: Record<FuelType, number> = {
    diesel: 0,   // Ej: 1.797
    regular: 1,  // Ej: Ecopaís a 2.722
    premium: 2,  // Ej: Súper a 4.880
  };

  for (const fuelType of FUEL_ORDER) {
    if (evidence[fuelType]) continue;

    const value = allCandidates[desiredIndex[fuelType]];
    if (value == null) continue;

    setBestEvidence(evidence, fuelType, {
      value,
      score: 0.55,
      source: 'fallback_order',
    });
  }

  return evidence;
};

const extractFuelPricesFromText = (text: string): { prices: FuelPriceInput; confidence: number } => {
  const lines = buildLineInfo(text);

  const evidence = assignFromLabels(lines);
  assignByOrder(lines, evidence);

  const prices: FuelPriceInput = {};
  let totalScore = 0;

  for (const fuelType of FUEL_ORDER) {
    const hit = evidence[fuelType];
    if (hit) {
      prices[fuelType] = hit.value;
      totalScore += hit.score;
    }
  }

  const confidence = totalScore / FUEL_ORDER.length;
  return { prices, confidence };
};

export const runOcrWithRetries = async (
  imageUri: string,
  minConfidence = 0.6,
  maxRetries = 2,
): Promise<{ output: OcrOutput; manualFallback: boolean }> => {
  let attempt = 0;
  let best: OcrOutput = { prices: {}, confidence: 0, rawText: '' };
  let lastError: string | undefined;

  while (attempt <= maxRetries) {
    try {
      const result = await TextRecognition.recognize(imageUri);
      const rawText = result?.text ?? '';

      const { prices, confidence } = extractFuelPricesFromText(rawText);

      const output: OcrOutput = {
        prices,
        confidence,
        rawText,
      };

      if (
        confidence > best.confidence ||
        (confidence === best.confidence && rawText.length > best.rawText.length)
      ) {
        best = output;
      }

      if (confidence >= minConfidence) {
        return { output, manualFallback: false };
      }
    } catch (error) {
      lastError = formatError(error);
      if (attempt === maxRetries) break;
    }

    attempt += 1;

    if (attempt <= maxRetries) {
      await sleep(120 * attempt);
    }
  }

  if (lastError && best.confidence === 0) {
    best.error = lastError;
  }

  return {
    output: best,
    manualFallback: true,
  };
};