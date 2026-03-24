import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Badge, Button, Input, StepDots } from '@/components/ui';
import { useTheme } from '@/theme/ThemeContext';
import { borderRadius, spacing } from '@/theme/spacing';
import { fontFamily, typography } from '@/theme/typography';

const INDUSTRIES = [
  'SaaS',
  'FinTech',
  'HealthTech',
  'E-commerce',
  'EdTech',
  'AI/ML',
  'DTC',
  'Other',
] as const;

type Industry = (typeof INDUSTRIES)[number];

export default function IndustrySelectScreen() {
  const { colors } = useTheme();

  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
  const [nicheInput, setNicheInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);

  function addKeyword() {
    const trimmed = nicheInput.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords((prev) => [...prev, trimmed]);
    }
    setNicheInput('');
  }

  function removeKeyword(keyword: string) {
    setKeywords((prev) => prev.filter((k) => k !== keyword));
  }

  function handleNext() {
    router.push({
      pathname: '/(onboarding)/platform-setup',
      params: {
        industry: selectedIndustry ?? '',
        keywords: JSON.stringify(keywords),
      },
    });
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      testID="industry-select-screen"
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          testID="back-button"
        >
          <Text style={[typography.bodyMd, { color: colors.accent, fontFamily: fontFamily.medium }]}>
            ← Back
          </Text>
        </Pressable>

        <Text style={[typography.headingXl, { color: colors.textPrimary }]}>
          {"What's your industry?"}
        </Text>
        <Text
          style={[typography.bodyLg, { color: colors.textSecondary, marginTop: -spacing.md }]}
        >
          This helps us find creators in your space
        </Text>

        {/* Industry grid */}
        <View style={styles.grid} testID="industry-grid">
          {INDUSTRIES.map((industry) => {
            const isSelected = selectedIndustry === industry;
            return (
              <Pressable
                key={industry}
                onPress={() => setSelectedIndustry(industry)}
                style={[
                  styles.card,
                  {
                    borderColor: isSelected ? colors.accent : colors.border,
                    backgroundColor: isSelected ? colors.accentLight : colors.surface,
                    borderRadius: borderRadius.lg,
                  },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={industry}
                testID={`industry-card-${industry}`}
              >
                {isSelected && (
                  <Text style={[styles.checkmark, { color: colors.accent }]}>✓ </Text>
                )}
                <Text
                  style={[
                    typography.bodySm,
                    {
                      fontFamily: fontFamily.semibold,
                      color: isSelected ? colors.accent : colors.textSecondary,
                      textAlign: 'center',
                    },
                  ]}
                >
                  {industry}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Niche keywords */}
        <View style={styles.nicheSection} testID="niche-section">
          <Text style={[typography.headingSm, { color: colors.textPrimary }]}>
            Add niche keywords
          </Text>
          <Input
            placeholder="e.g. bootstrapped, indie hacker"
            value={nicheInput}
            onChangeText={setNicheInput}
            returnKeyType="done"
            onSubmitEditing={addKeyword}
            testID="niche-input"
          />
          {keywords.length > 0 ? (
            <View style={styles.chipsRow} testID="keyword-chips">
              {keywords.map((kw) => (
                <Badge
                  key={kw}
                  label={kw}
                  onRemove={() => removeKeyword(kw)}
                  testID={`keyword-badge-${kw}`}
                />
              ))}
            </View>
          ) : null}
        </View>

        <Button
          label="Next"
          variant="primary"
          size="lg"
          fullWidth
          disabled={!selectedIndustry}
          onPress={handleNext}
          testID="next-button"
        />

        <StepDots total={4} current={1} testID="industry-step-dots" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    gap: spacing.xl,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  card: {
    width: '46%',
    borderWidth: 1.5,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 56,
  },
  checkmark: {
    fontSize: 13,
    fontWeight: '700',
  },
  nicheSection: {
    gap: spacing.md,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
