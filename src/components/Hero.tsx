import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withRepeat, 
  withSequence,
  withTiming 
} from 'react-native-reanimated';
import { COLORS } from '../constants/theme';
import { Rocket } from 'lucide-react-native';

interface HeroProps {
  value: number;
  isDashing: boolean;
}

export const Hero: React.FC<HeroProps> = ({ value, isDashing }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: withSpring(isDashing ? 1.2 : 1) },
        { translateY: withRepeat(withSequence(withTiming(-5), withTiming(0)), -1, true) }
      ],
      shadowOpacity: withTiming(isDashing ? 0.8 : 0.4),
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.glow} />
      <Rocket color={COLORS.primary} size={32} />
      <View style={styles.valueBadge}>
        <Text style={styles.valueText}>{value}</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  glow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    opacity: 0.2,
    blurRadius: 10,
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
