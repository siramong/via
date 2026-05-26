import TextRecognition from '@react-native-ml-kit/text-recognition';
import type { FuelPriceInput, FuelType } from '../types';

export type OcrOutput = {
  prices: FuelPriceInput;
  confidence: number;
  rawText: string;
};

const fuelPatterns: Record<FuelType, RegExp[]> = {
  regular: [/regular/i, /\breg\b/i, /unleaded/i],
  premium: [/premium/i, /\bprem\b/i, /super/i],
  diesel: [/diesel/i, /\bdsl\b/i],
};

const priceRegex = /(\d{1,2}\.\d{2})/;

const extractFuelPricesFromText = (text: string): FuelPriceInput => {
  const prices: FuelPriceInput = {};
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  for (const line of lines) {
    for (const fuelType of Object.keys(fuelPatterns) as FuelType[]) {
      if (fuelPatterns[fuelType].some((pattern) => pattern.test(line))) {
        const match = line.match(priceRegex);
        if (match) {
          prices[fuelType] = Number.parseFloat(match[1]);
        }
      }
    }
  }

  if (!prices.regular || !prices.premium || !prices.diesel) {
    const allMatches = lines
      .flatMap((line) => line.match(priceRegex))
      .filter(Boolean)
      .map((match) => Number.parseFloat((match as RegExpMatchArray)[1]));

    const fallback = allMatches.sort((a, b) => a - b);
    if (!prices.regular && fallback[0]) {
      prices.regular = fallback[0];
    }
    if (!prices.premium && fallback[1]) {
      prices.premium = fallback[1];
    }
    if (!prices.diesel && fallback[2]) {
      prices.diesel = fallback[2];
    }
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
    const matchedCount = Object.values(prices).filter((value) => typeof value === 'number').length;
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
