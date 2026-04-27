import React, { memo, useEffect, useRef, useCallback } from 'react';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence,
  runOnJS,
  Easing
} from 'react-native-reanimated';
import { StyleSheet, View, Text } from 'react-native';
import { COLORS } from '../constants/theme';

interface BattleProjectileProps {
  damage: number;
  startY: number;
  endY: number;
  onHit: () => void;
}

export const BattleProjectile: React.FC<BattleProjectileProps> = memo(({ 
  damage,
  startY, 
  endY, 
  onHit 
}) => {
  const progress = useSharedValue(0);
  const flash = useSharedValue(0);

  // Use ref to avoid stale closure issue with runOnJS
  const onHitRef = useRef(onHit);
  onHitRef.current = onHit;

  const handleHit = useCallback(() => {
    onHitRef.current();
  }, []);

  useEffect(() => {
    progress.value = withTiming(1, { 
      duration: 350, 
      easing: Easing.in(Easing.quad) 
    }, (finished) => {
      if (finished) {
        // Flash effect on impact
        flash.value = withSequence(
          withTiming(1, { duration: 50 }),
          withTiming(0, { duration: 150 })
        );
        runOnJS(handleHit)();
      }
    });
  }, []);


  const bulletStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: startY + (endY - startY) * progress.value },
      { scaleX: 1 + progress.value * 0.3 },
      { scaleY: 1 + progress.value * 0.5 },
    ],
    opacity: 1,
  }));

  const impactStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: endY },
      { scale: flash.value * 3 },
    ],
    opacity: flash.value,
  }));

  return (
    <>
      <Animated.View style={[styles.bullet, bulletStyle]}>
        <View style={styles.bulletCore} />
        <View style={styles.bulletTrail} />
        <Text style={styles.damageLabel}>-{damage}</Text>
      </Animated.View>
      <Animated.View style={[styles.impact, impactStyle]} />
    </>
  );
});

const styles = StyleSheet.create({
  bullet: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 250,
  },
  bulletCore: {
    width: 10,
    height: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 5,
    shadowColor: COLORS.primary,
    shadowRadius: 15,
    shadowOpacity: 1,
  },
  bulletTrail: {
    width: 4,
    height: 40,
    backgroundColor: COLORS.primary,
    opacity: 0.4,
    borderRadius: 2,
    marginTop: -2,
  },
  damageLabel: {
    color: COLORS.primary,
    fontWeight: '900',
    fontSize: 14,
    marginTop: 2,
  },
  impact: {
    position: 'absolute',
    alignSelf: 'center',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    zIndex: 260,
  },
});
