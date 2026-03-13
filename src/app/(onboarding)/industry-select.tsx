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
import { colors } from '@/theme/colors';
import { borderRadius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

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
    <SafeAreaView style={styles.container} testID="industry-select-screen">
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
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.heading}>What's your industry?</Text>
        <Text style={styles.subtitle}>This helps us find creators in your space</Text>

        {/* Industry grid */}
        <View style={styles.grid} testID="industry-grid">
          {INDUSTRIES.map((industry) => {
            const isSelected = selectedIndustry === industry;
            return (
              <Pressable
                key={industry}
                onPress={() => setSelectedIndustry(industry)}
                style={[styles.card, isSelected && styles.cardSelected]}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={industry}
                testID={`industry-card-${industry}`}
              >
                <Text style={[styles.cardLabel, isSelected && styles.cardLabelSelected]}>
                  {industry}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Niche keywords */}
        <View style={styles.nicheSection} testID="niche-section">
          <Text style={styles.nicheHeading}>Add niche keywords</Text>
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
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    paddingBottom: spacing['3xl'],
    gap: spacing.xl,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  backText: {
    ...typography.bodyMd,
    color: colors.primary[500],
    fontWeight: '500',
  },
  heading: {
    ...typography.headingXl,
    color: colors.gray[900],
  },
  subtitle: {
    ...typography.bodyLg,
    color: colors.gray[500],
    marginTop: -spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  card: {
    width: '46%',
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    backgroundColor: colors.white,
  },
  cardSelected: {
    backgroundColor: colors.primary[100],
    borderColor: colors.primary[500],
  },
  cardLabel: {
    ...typography.bodySm,
    fontWeight: '600',
    color: colors.gray[700],
    textAlign: 'center',
  },
  cardLabelSelected: {
    color: colors.primary[600],
  },
  nicheSection: {
    gap: spacing.md,
  },
  nicheHeading: {
    ...typography.headingSm,
    color: colors.gray[700],
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
