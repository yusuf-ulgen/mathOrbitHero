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

export const Explosion: React.FC<{ active: boolean, onComplete?: () => void }> = ({ active, onComplete }) => {
  const particles = Array.from({ length: 20 });
  const anim = useSharedValue(0);

  // Use ref to avoid stale closure issue with runOnJS
  const onCompleteRef = React.useRef(onComplete);
  onCompleteRef.current = onComplete;

  const handleComplete = React.useCallback(() => {
    if (onCompleteRef.current) onCompleteRef.current();
  }, []);

  React.useEffect(() => {
    if (active) {
      anim.value = 0;
      anim.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.exp) }, (finished) => {
        if (finished) {
          runOnJS(handleComplete)();
        }
      });
    }
  }, [active]);

  if (!active) return null;

  return (
    <View style={styles.explosionContainer}>
      {particles.map((_, i) => {
        const angle = (i / particles.length) * Math.PI * 2;
        const animatedStyle = useAnimatedStyle(() => {
          const distance = anim.value * 200;
          return {
            transform: [
              { translateX: Math.cos(angle) * distance },
              { translateY: Math.sin(angle) * distance },
              { scale: (1.5 - anim.value) },
            ],
            opacity: 1 - anim.value,
          };
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                backgroundColor: i % 3 === 0 ? COLORS.primary : i % 3 === 1 ? COLORS.warning : '#ff4d4d',
                width: i % 2 === 0 ? 30 : 20,
                height: i % 2 === 0 ? 30 : 20,
                shadowColor: '#fff',
                shadowRadius: 20,
                shadowOpacity: 1,
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
    borderRadius: 10,
  },
});
