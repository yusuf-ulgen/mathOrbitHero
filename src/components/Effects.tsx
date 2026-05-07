import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSequence,
  withTiming,
  useSharedValue,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { COLORS } from '../constants/theme';

export const ScreenShake: React.FC<{ active: boolean, children: React.ReactNode }> = ({ active, children }) => {
  const shake = useSharedValue(0);

  React.useEffect(() => {
    if (active) {
      shake.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

export const Explosion: React.FC<{ active: boolean, onComplete?: () => void, size?: number }> = ({ active, onComplete, size = 1 }) => {
  const particles = Array.from({ length: 28 });
  const anim = useSharedValue(0);
  const flash = useSharedValue(0);

  const onCompleteRef = React.useRef(onComplete);
  onCompleteRef.current = onComplete;

  const handleComplete = React.useCallback(() => {
    if (onCompleteRef.current) onCompleteRef.current();
  }, []);

  React.useEffect(() => {
    if (active) {
      anim.value = 0;
      flash.value = 0;

      flash.value = withSequence(
        withTiming(1, { duration: 50 }),
        withTiming(0, { duration: 300 })
      );

      anim.value = withTiming(1, {
        duration: 500,
        easing: Easing.out(Easing.back(1.5))
      }, (finished) => {
        if (finished) {
          runOnJS(handleComplete)();
        }
      });
    }
  }, [active]);

  if (!active) return null;

  return (
    <View style={styles.explosionContainer}>
      {/* Central Flash */}
      <Animated.View style={[
        styles.flash,
        useAnimatedStyle(() => ({
          transform: [{ scale: flash.value * 3 * size }],
          opacity: flash.value,
        }))
      ]} />

      {particles.map((_, i) => {
        const angle = (i / particles.length) * Math.PI * 2;
        const speed = 0.6 + Math.random() * 1.5;
        const delay = Math.random() * 0.1;
        const rotateDir = Math.random() > 0.5 ? 1 : -1;

        const animatedStyle = useAnimatedStyle(() => {
          // Start moving only as anim progresses
          const distance = anim.value * 150 * size * speed;
          // Scale should start at 0 and go to 1 then back to 0, or just fade
          const currentScale = anim.value < 0.2
            ? (anim.value / 0.2) * 1.5
            : 1.5 * (1 - anim.value);

          return {
            transform: [
              { translateX: Math.cos(angle) * distance },
              { translateY: Math.sin(angle) * distance },
              { scale: currentScale },
              { rotate: `${anim.value * 720 * rotateDir}deg` }
            ],
            opacity: anim.value < 0.1 ? anim.value * 10 : 1 - anim.value,
          };
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                backgroundColor: i % 3 === 0 ? COLORS.primary : i % 3 === 1 ? COLORS.warning : '#ff4d4d',
                width: i % 2 === 0 ? 12 : 8,
                height: i % 2 === 0 ? 20 : 15, // Rectangular shards
                shadowColor: '#fff',
                shadowRadius: 5,
                shadowOpacity: 0.5,
              },
              animatedStyle,
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  explosionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 300,
  },
  particle: {
    position: 'absolute',
    borderRadius: 2,
  },
  flash: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  }
});
