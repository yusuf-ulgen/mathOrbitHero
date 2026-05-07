import React, { useEffect, memo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing,
  cancelAnimation,
  interpolate,
  withSequence,
  runOnJS
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../constants/theme';
import { Explosion } from './Effects';

interface AsteroidProps {
  radius: number;
  angle: number;
  width: number;
  oscillationRange: number;
  oscillationSpeed: number;
  isPaused: boolean;
  isDestroyed: boolean;
}

export const Asteroid: React.FC<AsteroidProps> = memo(({ 
  radius, 
  angle, 
  width: angularWidth, 
  oscillationRange, 
  oscillationSpeed,
  isPaused,
  isDestroyed
}) => {
  const oscillation = useSharedValue(0);
  const scale = useSharedValue(1);
  const [showExplosion, setShowExplosion] = useState(false);

  useEffect(() => {
    if (isDestroyed && !showExplosion) {
      // Cinematic implosion: slightly swell up, then collapse
      scale.value = withSequence(
        withTiming(1.3, { duration: 150, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 200, easing: Easing.in(Easing.exp) }, (finished) => {
          if (finished) {
            runOnJS(setShowExplosion)(true);
          }
        })
      );
    }
  }, [isDestroyed]);

  useEffect(() => {
    if (isPaused) {
      cancelAnimation(oscillation);
    } else {
      oscillation.value = withRepeat(
        withTiming(1, { 
          duration: oscillationSpeed, 
          easing: Easing.inOut(Easing.quad) 
        }),
        -1,
        true
      );
    }
  }, [isPaused, oscillationSpeed]);

  const frozenAngle = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    if (isDestroyed && frozenAngle.value === 0) {
      // Capture the last angle when destruction starts
      // This is a bit tricky in useAnimatedStyle as it should be pure.
      // But we can use it to freeze the value.
    }

    const currentOscillation = interpolate(
      oscillation.value,
      [0, 1],
      [-oscillationRange / 2, oscillationRange / 2]
    );

    // If destroyed, we want to stop following the oscillation
    const finalAngle = isDestroyed ? angle : angle + currentOscillation;
    
    return {
      transform: [
        { rotate: `${finalAngle}deg` },
        { translateY: -radius }
      ]
    };
  });

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  // Simple asteroid shape using SVG
  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {!showExplosion ? (
        <Animated.View style={bodyStyle}>
          <Svg width={40} height={40} viewBox="0 0 100 100">
            <Path
              d="M50 10 L80 30 L90 70 L60 90 L20 80 L10 40 Z"
              fill={COLORS.textSecondary}
              stroke="#555"
              strokeWidth="5"
            />
            {/* Some craters */}
            <Path d="M30 40 Q35 45 40 40" fill="none" stroke="#333" strokeWidth="3" />
            <Path d="M60 60 Q65 65 70 60" fill="none" stroke="#333" strokeWidth="3" />
            <Path d="M50 30 Q55 35 60 30" fill="none" stroke="#333" strokeWidth="3" />
          </Svg>
        </Animated.View>
      ) : (
        <View style={styles.explosionWrapper}>
          <Explosion active={true} size={0.6} />
        </View>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    // Center it on the orbit line
    marginLeft: -20,
    marginTop: -20,
  },
  explosionWrapper: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
