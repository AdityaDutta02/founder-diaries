import React, { memo, useState } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { typography, fontFamily } from '@/theme/typography';
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
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const showCharCount = maxLength !== undefined;
  const charCount = value.length;

  const borderColor = error
    ? colors.error
    : isFocused
    ? colors.accent
    : colors.border;

  return (
    <View
      style={[{ gap: spacing.xs }, containerStyle]}
      testID={testID ? `${testID}-wrapper` : undefined}
    >
      {label ? (
        <Text
          style={{
            ...typography.label,
            fontFamily: fontFamily.semibold,
            color: colors.textSecondary,
            marginBottom: 2,
          }}
          testID={testID ? `${testID}-label` : undefined}
          accessibilityRole="text"
        >
          {label}
        </Text>
      ) : null}

      <View
        style={[
          {
            flexDirection: 'row' as const,
            alignItems: 'center' as const,
            borderWidth: 1.5,
            borderColor,
            borderRadius: borderRadius.md,
            backgroundColor: colors.surface,
            paddingHorizontal: spacing.md,
            minHeight: 44,
          },
          multiline && {
            alignItems: 'flex-start' as const,
            minHeight: 120,
            paddingVertical: spacing.sm,
          },
        ]}
      >
        <TextInput
          style={[
            {
              flex: 1,
              ...typography.bodyMd,
              fontFamily: fontFamily.regular,
              color: colors.textPrimary,
              paddingVertical: spacing.sm,
            },
            multiline && {
              textAlignVertical: 'top' as const,
              paddingTop: spacing.xs,
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
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
          <View style={{ marginLeft: spacing.sm, justifyContent: 'center' }}>{rightIcon}</View>
        ) : null}
      </View>

      <View
        style={{
          flexDirection: 'row' as const,
          justifyContent: 'space-between' as const,
          alignItems: 'flex-start' as const,
          minHeight: 0,
        }}
      >
        <View style={{ flex: 1 }}>
          {error ? (
            <Text
              style={{
                ...typography.bodySm,
                color: colors.error,
              }}
              testID={testID ? `${testID}-error` : undefined}
              accessibilityRole="alert"
            >
              {error}
            </Text>
          ) : helperText ? (
            <Text
              style={{
                ...typography.caption,
                color: colors.textMuted,
              }}
              testID={testID ? `${testID}-helper` : undefined}
            >
              {helperText}
            </Text>
          ) : null}
        </View>
        {showCharCount ? (
          <Text
            style={{
              ...typography.caption,
              color: colors.textMuted,
              marginLeft: spacing.sm,
            }}
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
      <Text style={{ fontSize: 18 }}>{visible ? '👁️' : '🙈'}</Text>
    </Pressable>
  );
});
