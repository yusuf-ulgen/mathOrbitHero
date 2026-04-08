import React, { memo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { COLORS } from '../constants/theme';
import { Target } from 'lucide-react-native';

interface HeroProps {
  value: number;
  isShooting: boolean;
}

export const Hero: React.FC<HeroProps> = memo(({ value, isShooting }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: withSpring(isShooting ? 0.8 : 1) },
        { translateY: withSequence(withTiming(isShooting ? -5 : 0, { duration: 50 }), withSpring(0)) }
      ],
    };
  });

  return (
    <View style={styles.container}>
      {/* Power Label Above Head */}
      <View style={styles.powerLabel}>
        <Text style={styles.powerText}>{value}</Text>
      </View>
      
      <Animated.View style={[styles.heroBody, animatedStyle]}>
        <View style={styles.glow} />
        <Target size={40} color={COLORS.primary} strokeWidth={2.5} />
        
        {/* Visual decoration */}
        <View style={styles.core} />
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  powerLabel: {
    position: 'absolute',
    top: -45,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  powerText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 18,
    textShadowColor: COLORS.primary,
    textShadowRadius: 10,
  },
  heroBody: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 247, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    opacity: 0.2,
  },
  core: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    position: 'absolute',
  },
  valueBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fff',
  },
  valueText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
