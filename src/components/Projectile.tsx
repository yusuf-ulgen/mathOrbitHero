import React, { memo, useEffect } from 'react';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  runOnJS 
} from 'react-native-reanimated';
import { StyleSheet, View } from 'react-native';
import { COLORS } from '../constants/theme';

interface ProjectileProps {
  targetRadius: number;
  onHit: () => void;
}

export const Projectile: React.FC<ProjectileProps> = memo(({ targetRadius, onHit }) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(-targetRadius, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(onHit)();
      }
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.bullet, animatedStyle]} />
  );
});

const styles = StyleSheet.create({
  bullet: {
    position: 'absolute',
    width: 6,
    height: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 3,
    shadowColor: COLORS.primary,
    shadowRadius: 10,
    shadowOpacity: 1,
    zIndex: 50,
  },
});
