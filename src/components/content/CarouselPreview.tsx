import React, { memo, useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import type { CarouselSlide } from '@/stores/contentStore';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SLIDE_PADDING = spacing.lg * 2;
const SLIDE_SIZE = SCREEN_WIDTH - SLIDE_PADDING;

interface CarouselPreviewProps {
  slides: CarouselSlide[];
  onSlideChange?: (index: number) => void;
  testID?: string;
}

function SlideItem({ slide, index }: { slide: CarouselSlide; index: number }) {
  return (
    <View style={styles.slide} testID={`carousel-slide-${index}`}>
      <View style={styles.slideInner}>
        <Text style={styles.slideNumber}>
          {slide.slideNumber}
        </Text>
        <Text style={styles.heading} testID={`carousel-heading-${index}`}>
          {slide.heading}
        </Text>
        <Text style={styles.bodyText} testID={`carousel-body-${index}`}>
          {slide.bodyText}
        </Text>
        {slide.imagePrompt ? (
          <Text style={styles.imagePromptHint} numberOfLines={2}>
            Image: {slide.imagePrompt}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export const CarouselPreview = memo(function CarouselPreview({
  slides,
  onSlideChange,
  testID,
}: CarouselPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<CarouselSlide>>(null);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / SLIDE_SIZE);
      if (index !== currentIndex) {
        setCurrentIndex(index);
        onSlideChange?.(index);
      }
    },
    [currentIndex, onSlideChange],
  );

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<CarouselSlide>) => (
      <SlideItem slide={item} index={index} />
    ),
    [],
  );

  const keyExtractor = useCallback(
    (item: CarouselSlide) => String(item.slideNumber),
    [],
  );

  return (
    <View style={styles.container} testID={testID ?? 'carousel-preview'}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={SLIDE_SIZE}
        decelerationRate="fast"
      />

      {/* Counter */}
      <Text style={styles.counter} testID="carousel-counter">
        {currentIndex + 1}/{slides.length}
      </Text>

      {/* Dot indicators */}
      <View style={styles.dotsContainer} testID="carousel-dots">
        {slides.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, index === currentIndex && styles.dotActive]}
            testID={`carousel-dot-${index}`}
          />
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  slide: {
    width: SLIDE_SIZE,
    aspectRatio: 1,
    marginHorizontal: 0,
  },
  slideInner: {
    flex: 1,
    backgroundColor: colors.primary[50],
    borderRadius: borderRadius.lg,
    padding: spacing['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  slideNumber: {
    ...typography.bodySm,
    color: colors.primary[500],
    fontWeight: '600',
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  heading: {
    ...typography.headingMd,
    color: colors.gray[900],
    textAlign: 'center',
  },
  bodyText: {
    ...typography.bodyMd,
    color: colors.gray[700],
    textAlign: 'center',
  },
  imagePromptHint: {
    ...typography.bodySm,
    color: colors.gray[400],
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  counter: {
    ...typography.bodySm,
    color: colors.gray[500],
    textAlign: 'right',
    paddingHorizontal: spacing.xs,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[200],
  },
  dotActive: {
    backgroundColor: colors.primary[500],
    width: 16,
  },
});
