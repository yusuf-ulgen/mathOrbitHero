import React, { memo, useEffect, useRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { COLORS } from '../constants/theme';
import { Shell } from 'lucide-react-native';

interface MeteorProps {
  health: number;
  maxHealth: number;
  onArrived: () => void;
}

export const Meteor: React.FC<MeteorProps> = memo(({ health, maxHealth, onArrived }) => {
  const translateY = useSharedValue(-300);
  const scale = useSharedValue(0.5);
  const pulse = useSharedValue(1);
  const arrivedCalled = useRef(false);

  useEffect(() => {
    // Meteor comes from the top of the screen and stops at a position
    scale.value = withTiming(1, { duration: 1500, easing: Easing.out(Easing.quad) });
    translateY.value = withTiming(0, {
      duration: 1500,
      easing: Easing.out(Easing.back(1.2))
    });

    // Call onArrived after animation completes (match duration)
    const timer = setTimeout(() => {
      if (!arrivedCalled.current) {
        arrivedCalled.current = true;
        onArrived();
      }
    }, 1600); // slightly longer than animation duration

    // Pulse effect
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 800, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false
    );

    return () => clearTimeout(timer);
  }, []);


  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value * pulse.value }
    ],
  }));

  const healthPercent = maxHealth > 0 ? health / maxHealth : 0;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.glow} />
      <View style={styles.meteorBody}>
        <Shell
          size={90}
          color={COLORS.danger}
        />
        {/* Health bar */}
        <View style={styles.healthBarBg}>
          <View style={[styles.healthBarFill, {
            width: `${healthPercent * 100}%`,
            backgroundColor: healthPercent > 0.5 ? COLORS.danger : healthPercent > 0.25 ? COLORS.warning : '#ff0000',
          }]} />
        </View>
        {/* Health number */}
        <View style={styles.healthTag}>
          <Text style={styles.healthText}>{health}</Text>
        </View>
        {/* Internal fire core */}
        <View style={styles.fireCore} />
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  glow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.danger,
    opacity: 0.15,
  },
  meteorBody: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthBarBg: {
    width: 100,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    marginTop: 8,
    overflow: 'hidden',
  },
  healthBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  healthTag: {
    position: 'absolute',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'rgba(0,0,0,0.85)',
    top: -25,
    minWidth: 50,
    alignItems: 'center',
  },
  healthText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 20,
  },
  fireCore: {
    position: 'absolute',
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: COLORS.warning,
    opacity: 0.4,
  }
});
