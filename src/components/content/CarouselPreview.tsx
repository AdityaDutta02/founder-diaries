import React, { memo, useCallback, useRef, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import type { CarouselSlide } from '@/stores/contentStore';
import { useTheme } from '@/theme/ThemeContext';
import { typography } from '@/theme/typography';
import { borderRadius, spacing } from '@/theme/spacing';

const SLIDE_PADDING = spacing.lg * 2;

interface CarouselPreviewProps {
  slides: CarouselSlide[];
  onSlideChange?: (index: number) => void;
  testID?: string;
}

interface SlideItemProps {
  slide: CarouselSlide;
  index: number;
  slideWidth: number;
}

function SlideItem({ slide, index, slideWidth }: SlideItemProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.slide, { width: slideWidth }]} testID={`carousel-slide-${index}`}>
      <View
        style={[
          styles.slideInner,
          {
            backgroundColor: colors.accentLight,
            borderColor: colors.accent + '4D', // 0.3 opacity
          },
        ]}
      >
        <Text
          style={[styles.slideNumber, { color: colors.textMuted }]}
          testID={`carousel-slide-num-${index}`}
        >
          {slide.slideNumber}
        </Text>
        <Text
          style={[styles.heading, { color: colors.textPrimary }]}
          testID={`carousel-heading-${index}`}
        >
          {slide.heading}
        </Text>
        <Text
          style={[styles.bodyText, { color: colors.textPrimary }]}
          testID={`carousel-body-${index}`}
        >
          {slide.bodyText}
        </Text>
        {slide.imagePrompt ? (
          <Text
            style={[styles.imagePromptHint, { color: colors.textMuted }]}
            numberOfLines={2}
          >
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
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const slideSize = screenWidth - SLIDE_PADDING;
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<CarouselSlide>>(null);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
      if (index !== currentIndex) {
        setCurrentIndex(index);
        onSlideChange?.(index);
      }
    },
    [currentIndex, onSlideChange],
  );

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<CarouselSlide>) => (
      <SlideItem slide={item} index={index} slideWidth={slideSize} />
    ),
    [slideSize],
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
        snapToInterval={slideSize}
        decelerationRate="fast"
      />

      {/* Counter */}
      <Text
        style={[styles.counter, { color: colors.textMuted }]}
        testID="carousel-counter"
      >
        {currentIndex + 1}/{slides.length}
      </Text>

      {/* Dot indicators */}
      <View style={styles.dotsContainer} testID="carousel-dots">
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor:
                  index === currentIndex ? colors.accent : colors.border,
                width: index === currentIndex ? 16 : 6,
              },
            ]}
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
    // width set dynamically via style prop
    aspectRatio: 1,
    marginHorizontal: 0,
  },
  slideInner: {
    flex: 1,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing['2xl'],
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  slideNumber: {
    ...typography.label,
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  heading: {
    ...typography.headingMd,
    textAlign: 'center',
  },
  bodyText: {
    ...typography.bodyMd,
    textAlign: 'center',
  },
  imagePromptHint: {
    ...typography.bodySm,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: spacing.sm,
  },
  counter: {
    ...typography.caption,
    textAlign: 'right',
    paddingHorizontal: spacing.xs,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dot: {
    height: 6,
    borderRadius: borderRadius.full,
  },
});
