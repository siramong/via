import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { runOcrWithRetries } from '../services/ocr';
import { PriceSelector } from '../components/PriceSelector';
import { colors, radius, spacing } from '../theme';
import { supabase } from '../services/supabase';
import { useUserStore } from '../state/userStore';
import type { FuelType, FuelPriceInput } from '../types';

export const ContributeScreen = () => {
  const { profile, grantAccess, session } = useUserStore();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [prices, setPrices] = useState<FuelPriceInput>({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'camera' | 'ocr' | 'review'>('camera');
  const [error, setError] = useState<string | null>(null);

  const pickImage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setStep('ocr');
        await runOcr(result.assets[0].uri);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const runOcr = useCallback(async (uri: string) => {
    setLoading(true);
    try {
      const { output, manualFallback } = await runOcrWithRetries(uri);
      setPrices(output.prices);
      if (manualFallback) {
        Alert.alert('OCR', 'Confidence low. Please adjust prices manually.');
      }
      setStep('review');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePrice = (fuelType: FuelType, value: number) => {
    setPrices((prev) => ({ ...prev, [fuelType]: value }));
  };

  const submitReport = useCallback(async () => {
    if (!imageUri || !session || !profile) return;
    setLoading(true);
    setError(null);
    try {
      const filename = `${profile.id}_${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('reports')
        .upload(filename, {
          uri: imageUri,
          name: filename,
          type: 'image/jpeg',
        } as any);

      if (uploadError) throw uploadError;

      const { error: reportError } = await supabase.from('reports').insert({
        user_id: profile.id,
        image_url: uploadData?.path ?? filename,
        ocr_json: prices,
        status: 'pending',
      });

      if (reportError) throw reportError;

      await grantAccess(2, 'valid_report');

      Alert.alert('Success', 'Report submitted! You earned +2 access.');
      setImageUri(null);
      setPrices({});
      setStep('camera');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [imageUri, session, profile, prices, grantAccess]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {step === 'camera' && (
        <View style={styles.section}>
          <Text style={styles.title}>Contribute Fuel Prices</Text>
          <Text style={styles.subtitle}>
            Take a photo of the fuel pump display and help the community.
          </Text>
          <Pressable style={styles.primaryButton} onPress={pickImage} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Capture Photo</Text>}
          </Pressable>
        </View>
      )}

      {step === 'review' && imageUri && (
        <View style={styles.section}>
          <Text style={styles.title}>Verify Prices</Text>
          <Text style={styles.subtitle}>Adjust any incorrect values below:</Text>

          <View style={styles.prices}>
            {(['regular', 'premium', 'diesel'] as const).map((fuelType) => (
              <PriceSelector
                key={fuelType}
                label={fuelType}
                value={prices[fuelType] ?? 0}
                onChange={(v) => updatePrice(fuelType, v)}
              />
            ))}
          </View>

          {!!error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.actions}>
            <Pressable
              style={[styles.button, styles.secondaryButton]}
              onPress={() => {
                setStep('camera');
                setImageUri(null);
                setPrices({});
              }}
            >
              <Text style={styles.buttonText}>Retake</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={submitReport} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit</Text>}
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  section: {
    marginTop: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  prices: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  primaryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: colors.border,
  },
  button: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    flex: 1,
  },
  buttonText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  actions: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    gap: spacing.md,
  },
  error: {
    color: colors.danger,
    marginTop: spacing.md,
  },
});
