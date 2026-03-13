import React, { memo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';

export interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  helperText?: string;
  multiline?: boolean;
  maxLength?: number;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: string;
  textContentType?: string;
  autoFocus?: boolean;
  /** Extra icon shown on the right side of the input */
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  testID?: string;
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send';
  onSubmitEditing?: () => void;
  numberOfLines?: number;
  textAlignVertical?: 'auto' | 'top' | 'bottom' | 'center';
}

export const Input = memo(function Input({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  helperText,
  multiline = false,
  maxLength,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoComplete,
  textContentType,
  autoFocus = false,
  rightIcon,
  containerStyle,
  testID,
  returnKeyType,
  onSubmitEditing,
  numberOfLines,
  textAlignVertical,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const showCharCount = maxLength !== undefined;
  const charCount = value.length;

  return (
    <View
      style={[styles.container, containerStyle]}
      testID={testID ? `${testID}-wrapper` : undefined}
    >
      {label ? (
        <Text
          style={styles.label}
          testID={testID ? `${testID}-label` : undefined}
          accessibilityRole="text"
        >
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputWrapper,
          multiline && styles.multilineWrapper,
          isFocused && styles.focused,
          error ? styles.errorBorder : null,
        ]}
      >
        <TextInput
          style={[styles.input, multiline && styles.multilineInput]}
          placeholder={placeholder}
          placeholderTextColor={colors.gray[400]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete as never}
          textContentType={textContentType as never}
          autoFocus={autoFocus}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={textAlignVertical}
          maxLength={maxLength}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          testID={testID}
          accessibilityLabel={label ?? placeholder}
        />
        {rightIcon ? (
          <View style={styles.rightIcon}>{rightIcon}</View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          {error ? (
            <Text
              style={styles.error}
              testID={testID ? `${testID}-error` : undefined}
              accessibilityRole="alert"
            >
              {error}
            </Text>
          ) : helperText ? (
            <Text
              style={styles.helperText}
              testID={testID ? `${testID}-helper` : undefined}
            >
              {helperText}
            </Text>
          ) : null}
        </View>
        {showCharCount ? (
          <Text
            style={styles.charCount}
            testID={testID ? `${testID}-char-count` : undefined}
          >
            {charCount}/{maxLength}
          </Text>
        ) : null}
      </View>
    </View>
  );
});

interface EyeToggleProps {
  visible: boolean;
  onToggle: () => void;
}

export const EyeToggle = memo(function EyeToggle({ visible, onToggle }: EyeToggleProps) {
  return (
    <Pressable
      onPress={onToggle}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={visible ? 'Hide password' : 'Show password'}
      testID="eye-toggle"
    >
      <Text style={styles.eyeIcon}>{visible ? '👁️' : '🙈'}</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.gray[700],
    marginBottom: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[50],
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  multilineWrapper: {
    alignItems: 'flex-start',
    minHeight: 120,
    paddingVertical: spacing.sm,
  },
  focused: {
    borderColor: colors.primary[500],
  },
  errorBorder: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    ...typography.bodyMd,
    color: colors.gray[900],
    paddingVertical: spacing.sm,
  },
  multilineInput: {
    textAlignVertical: 'top',
    paddingTop: spacing.xs,
  },
  rightIcon: {
    marginLeft: spacing.sm,
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    minHeight: 0,
  },
  footerLeft: {
    flex: 1,
  },
  error: {
    ...typography.bodySm,
    color: colors.error,
  },
  helperText: {
    ...typography.bodySm,
    color: colors.gray[500],
  },
  charCount: {
    ...typography.bodySm,
    color: colors.gray[400],
    marginLeft: spacing.sm,
  },
  eyeIcon: {
    fontSize: 18,
  },
});
