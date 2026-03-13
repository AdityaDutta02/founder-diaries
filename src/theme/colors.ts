export const colors = {
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
  },
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    400: '#9CA3AF',
    500: '#6B7280',
    700: '#374151',
    900: '#111827',
  },
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  platform: {
    linkedin: '#0A66C2',
    instagram: '#E1306C',
    x: '#000000',
  },
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const darkColors = {
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
  },
  gray: {
    50: '#111827',
    100: '#1F2937',
    200: '#374151',
    400: '#9CA3AF',
    500: '#6B7280',
    700: '#D1D5DB',
    900: '#F9FAFB',
  },
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  platform: {
    linkedin: '#0A66C2',
    instagram: '#E1306C',
    x: '#000000',
  },
  white: '#FFFFFF',
  black: '#000000',
} as const;

export type Colors = typeof colors;
export type DarkColors = typeof darkColors;
