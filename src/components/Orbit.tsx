import React, { useEffect, memo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import { COLORS } from '../constants/theme';
import { MathSlot } from '../utils/levelGenerator';

interface OrbitProps {
  radius: number;
  rotationSpeed: number;
  slots: MathSlot[];
  isActive: boolean;
}

export const Orbit: React.FC<OrbitProps> = memo(({ radius, rotationSpeed, slots, isActive }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = 0;
    rotation.value = withRepeat(
      withTiming(360, { duration: rotationSpeed, easing: Easing.linear }),
      -1,
      false
    );
  }, [rotationSpeed]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={[styles.container, { width: radius * 2, height: radius * 2 }]}>
      <View style={[
        styles.ring, 
        { 
          width: radius * 2, 
          height: radius * 2, 
          borderRadius: radius,
          borderColor: isActive ? COLORS.primary : COLORS.orbit,
          borderWidth: isActive ? 2 : 1,
          opacity: isActive ? 1 : 0.5,
        }
      ]} />
      
      <Animated.View style={[styles.content, animatedStyle]}>
        {slots.map((slot, i) => {
          const angle = i * 120; // 3 slots
          const isNegative = slot.op === '-' || slot.op === '/';
          
          return (
            <View key={`slot-${i}`} style={[
              styles.item, 
              { transform: [{ rotate: `${angle}deg` }, { translateY: -radius }] }
            ]}>
              <View style={[
                styles.slotBox,
                { borderColor: isNegative ? COLORS.danger : COLORS.success }
              ]}>
                <Text style={[
                  styles.slotText,
                  { color: isNegative ? COLORS.danger : COLORS.success }
                ]}>
                  {slot.label}
                </Text>
              </View>
            </View>
          );
        })}
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    borderWidth: 1,
    position: 'absolute',
  },
  content: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  item: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotBox: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    minWidth: 50,
    alignItems: 'center',
  },
  slotText: {
    fontWeight: 'bold',
    fontSize: 16,
    textShadowRadius: 5,
  },
});
