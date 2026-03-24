import { StyleSheet } from 'react-native';
import { borderRadius, spacing } from '@/theme/spacing';
import { fontFamily } from '@/theme/typography';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    gap: spacing.xl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: borderRadius.full,
    marginBottom: spacing.xs,
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 64,
    width: '100%',
  },
  waveBar: {
    width: 3,
    borderRadius: borderRadius.full,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  timer: {
    fontFamily: fontFamily.bold,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: 2,
  },
  timerTotal: {
    fontFamily: fontFamily.regular,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: 1,
  },
  // ─── Recording controls ──────────────────────────────────────────────────
  recordingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['2xl'],
    marginTop: spacing.sm,
  },
  sideControlBtn: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideControlIcon: {
    fontSize: 20,
  },
  cancelText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  stopBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#C53030',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C53030',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  stopInner: {
    width: 28,
    height: 28,
    borderRadius: 4,
  },
  // ─── Preview controls ────────────────────────────────────────────────────
  previewSection: {
    width: '100%',
    gap: spacing.xl,
    alignItems: 'center',
  },
  playbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing['3xl'],
  },
  seekBtn: {
    alignItems: 'center',
    gap: 2,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
  },
  seekIcon: {
    fontSize: 22,
  },
  seekLabel: {
    fontFamily: fontFamily.medium,
    fontSize: 11,
    lineHeight: 14,
  },
  playBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnIcon: {
    fontSize: 26,
  },
  previewActions: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    height: 52,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actionBtnText: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    lineHeight: 20,
  },
});
