import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { typography, fontFamily } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import {
  getUnansweredQuestion,
  submitAnswer,
} from '@/services/personaService';
import type { EnrichmentAnswer } from '@/services/personaService';
import { logger } from '@/lib/logger';

const MAX_ANSWER_LENGTH = 500;

// Category to emoji map — keeps the UI warm and expressive
const CATEGORY_EMOJI: Record<string, string> = {
  background: '🌱',
  personality: '✨',
  values: '💡',
  lifestyle: '☀️',
  goals: '🎯',
  hobbies: '🎨',
  challenges: '💪',
  story: '📖',
};

function getEmoji(category: string | null): string {
  if (!category) return '🤔';
  return CATEGORY_EMOJI[category.toLowerCase()] ?? '🤔';
}

type ModalState = 'loading' | 'question' | 'success' | 'empty';

export default function QuestionAnswerModal() {
  const { colors } = useTheme();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);

  const [modalState, setModalState] = useState<ModalState>('loading');
  const [question, setQuestion] = useState<EnrichmentAnswer | null>(null);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const animateIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Load the unanswered question on mount
  useEffect(() => {
    async function fetchQuestion() {
      const userId = session?.user?.id;
      if (!userId) {
        router.dismiss();
        return;
      }

      try {
        const unanswered = await getUnansweredQuestion(userId);
        if (!unanswered) {
          setModalState('empty');
          // Auto-close if there's nothing to answer
          setTimeout(() => router.dismiss(), 500);
          return;
        }
        setQuestion(unanswered);
        setModalState('question');
        animateIn();
      } catch (err) {
        logger.error('Failed to fetch unanswered question', {
          error: err instanceof Error ? err.message : String(err),
        });
        router.dismiss();
      }
    }

    void fetchQuestion();
  }, [session, router, animateIn]);

  const handleSkip = useCallback(() => {
    Keyboard.dismiss();
    router.dismiss();
  }, [router]);

  const handleSubmit = useCallback(async () => {
    if (!question || answer.trim().length === 0) return;
    Keyboard.dismiss();
    setIsSubmitting(true);

    try {
      await submitAnswer(question.id, answer.trim());
      setModalState('success');

      // Show "Thanks" state briefly then close
      setTimeout(() => router.dismiss(), 1200);
    } catch (err) {
      logger.error('Failed to submit enrichment answer', {
        error: err instanceof Error ? err.message : String(err),
        questionId: question.id,
      });
      // Still close gracefully — the answer may have saved
      router.dismiss();
    } finally {
      setIsSubmitting(false);
    }
  }, [question, answer, router]);

  if (modalState === 'loading' || modalState === 'empty') {
    return (
      <View
        style={{ flex: 1, backgroundColor: colors.background }}
        testID="question-answer-blank"
      />
    );
  }

  if (modalState === 'success') {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        testID="question-answer-success"
      >
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>🙏</Text>
          <Text style={[typography.headingLg, { color: colors.textPrimary }]}>Thanks!</Text>
        </View>
      </SafeAreaView>
    );
  }

  const emoji = getEmoji(question?.question_category ?? null);
  const charCount = answer.length;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      testID="question-answer-modal"
    >
      {/* Close / skip button in corner */}
      <Pressable
        style={styles.closeButton}
        onPress={handleSkip}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Close"
        testID="question-answer-close"
      >
        <Text style={[styles.closeIcon, { color: colors.textMuted }]}>✕</Text>
      </Pressable>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.contentContainer,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Emoji */}
            <Text style={styles.topEmoji} testID="question-emoji">
              {emoji}
            </Text>

            {/* Category badge */}
            <View
              style={[
                styles.categoryBadge,
                {
                  backgroundColor: colors.accentLight,
                  borderRadius: borderRadius.full,
                },
              ]}
              testID="question-category-badge"
            >
              <Text
                style={[
                  typography.label,
                  { color: colors.accent, fontFamily: fontFamily.semibold },
                ]}
              >
                Just curious
              </Text>
            </View>

            {/* Question card */}
            <View
              style={[
                styles.questionCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: borderRadius.lg,
                },
              ]}
            >
              <Text
                style={[typography.headingMd, { color: colors.textPrimary, textAlign: 'center', lineHeight: 30 }]}
                testID="question-text"
              >
                {question?.question ?? ''}
              </Text>
            </View>

            {/* Answer input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  typography.bodyLg,
                  styles.input,
                  {
                    backgroundColor: colors.surface2,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                    borderRadius: borderRadius.lg,
                  },
                ]}
                value={answer}
                onChangeText={(text) => {
                  if (text.length <= MAX_ANSWER_LENGTH) setAnswer(text);
                }}
                placeholder="Whatever comes to mind..."
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={MAX_ANSWER_LENGTH}
                textAlignVertical="top"
                autoCorrect
                autoCapitalize="sentences"
                accessibilityLabel="Answer input"
                testID="answer-input"
              />
              <Text
                style={[
                  typography.bodySm,
                  {
                    color:
                      charCount > MAX_ANSWER_LENGTH * 0.9 ? colors.warning : colors.textMuted,
                    textAlign: 'right',
                    paddingRight: spacing.xs,
                  },
                ]}
                testID="char-counter"
              >
                {charCount}/{MAX_ANSWER_LENGTH}
              </Text>
            </View>

            {/* Action buttons */}
            <View style={styles.actions}>
              <Button
                label="Skip for now"
                variant="outline"
                size="md"
                onPress={handleSkip}
                style={styles.skipButton}
                testID="skip-button"
              />
              <Button
                label="That's it! ✓"
                variant="primary"
                size="md"
                loading={isSubmitting}
                disabled={answer.trim().length === 0}
                onPress={() => void handleSubmit()}
                style={styles.submitButton}
                testID="submit-button"
              />
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: spacing['3xl'],
    right: spacing.lg,
    zIndex: 10,
    padding: spacing.sm,
  },
  closeIcon: {
    fontSize: 18,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing['4xl'],
  },
  contentContainer: {
    alignItems: 'center',
    gap: spacing.xl,
  },
  topEmoji: {
    fontSize: 48,
    textAlign: 'center',
  },
  categoryBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  questionCard: {
    borderWidth: 1,
    padding: spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  inputContainer: {
    width: '100%',
    gap: spacing.xs,
  },
  input: {
    borderWidth: 1.5,
    padding: spacing.lg,
    minHeight: 120,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  skipButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  successEmoji: {
    fontSize: 56,
  },
});
