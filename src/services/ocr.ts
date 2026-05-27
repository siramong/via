import TextRecognition from '@react-native-ml-kit/text-recognition';
import type { FuelPriceInput, FuelType } from '../types';

export type OcrOutput = {
  prices: FuelPriceInput;
  confidence: number;
  rawText: string;
};

const fuelPatterns: Record<FuelType, RegExp[]> = {
  regular: [/regular/i, /\breg\b/i, /unleaded/i, /ecopais/i, /ecopaís/i, /extra/i],
  premium: [/premium/i, /\bprem\b/i, /super/i],
  diesel: [/diesel/i, /\bdsl\b/i],
};

const priceRegex = /(\d{1,2}\.\d{2})/;

const extractFuelPricesFromText = (text: string): FuelPriceInput => {
  const prices: FuelPriceInput = {};
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const fuelLines: { fuelType: FuelType; lineIndex: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const fuelType of Object.keys(fuelPatterns) as FuelType[]) {
      if (fuelPatterns[fuelType].some((p) => p.test(line))) {
        fuelLines.push({ fuelType, lineIndex: i });
        break;
      }
    }
  }

  for (const fl of fuelLines) {
    if (prices[fl.fuelType] !== undefined) continue;
    for (let offset = 0; offset <= 2; offset++) {
      const idx = fl.lineIndex + offset;
      if (idx >= lines.length) break;
      const m = lines[idx].match(priceRegex);
      if (m) {
        prices[fl.fuelType] = Number.parseFloat(m[1]);
        break;
      }
    }
  }

  if (!prices.regular || !prices.premium || !prices.diesel) {
    const allMatches = lines
      .flatMap((line) => {
        const m = line.match(priceRegex);
        return m ? [m[1]] : [];
      })
      .map(Number.parseFloat);

    const sorted = [...allMatches].sort((a, b) => a - b);
    if (!prices.regular && sorted[0]) prices.regular = sorted[0];
    if (!prices.premium && sorted[1]) prices.premium = sorted[1];
    if (!prices.diesel && sorted[2]) prices.diesel = sorted[2];
  }

  return prices;
};

export const runOcrWithRetries = async (
  imageUri: string,
  minConfidence = 0.6,
  maxRetries = 2,
): Promise<{ output: OcrOutput; manualFallback: boolean }> => {
  let attempt = 0;
  let best: OcrOutput = { prices: {}, confidence: 0, rawText: '' };

  while (attempt <= maxRetries) {
    const result = await TextRecognition.recognize(imageUri);
    const rawText = result.text ?? '';
    const prices = extractFuelPricesFromText(rawText);
    const matchedCount = Object.values(prices).filter((v) => typeof v === 'number').length;
    const confidence = matchedCount / 3;

    const output = { prices, confidence, rawText };
    if (confidence > best.confidence) {
      best = output;
    }

    if (confidence >= minConfidence) {
      return { output, manualFallback: false };
    }

    attempt += 1;
  }

  return { output: best, manualFallback: true };
};
