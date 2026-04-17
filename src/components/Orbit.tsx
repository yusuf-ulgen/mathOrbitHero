import React, { useEffect, memo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
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
  initialRotation: number;
}

export const Orbit: React.FC<OrbitProps> = memo(({ radius, rotationSpeed, slots, isActive, initialRotation }) => {
  const rotation = useSharedValue(initialRotation);
  const circumference = 2 * Math.PI * radius;
  const strokeDash = circumference / 3;

  useEffect(() => {
    rotation.value = initialRotation;
    rotation.value = withRepeat(
      withTiming(initialRotation + 360, { duration: rotationSpeed, easing: Easing.linear }),
      -1,
      false
    );
  }, [rotationSpeed, initialRotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
    opacity: isActive ? 1 : 0.3,
  }));

  return (
    <View style={[styles.container, { width: radius * 2, height: radius * 2 }]}>
      <Animated.View style={[styles.content, animatedStyle]}>
        <Svg width={radius * 2} height={radius * 2} style={{ position: 'absolute' }}>
          {slots.map((slot, i) => {
            const isNegative = slot.op === '-' || slot.op === '/';
            const color = isNegative ? COLORS.danger : COLORS.success;
            return (
              <Circle
                key={`arc-${i}`}
                cx={radius}
                cy={radius}
                r={radius - 3} // Adjusting for stroke width
                stroke={color}
                strokeWidth={6}
                strokeDasharray={`${strokeDash} ${circumference}`}
                fill="transparent"
                rotation={(i * 120) - 150} // Offsets exact 120 degree chunks properly
                origin={`${radius}, ${radius}`}
                opacity={isActive ? 0.8 : 0.3}
              />
            );
          })}
        </Svg>

        {slots.map((slot, i) => {
          const angle = i * 120; // 3 segments
          const isNegative = slot.op === '-' || slot.op === '/';
          const color = isNegative ? COLORS.danger : COLORS.success;
          
          return (
            <View key={`slot-${i}`} style={[
              styles.segment, 
              { transform: [{ rotate: `${angle}deg` }] }
            ]}>
              <View style={[
                styles.item,
                { transform: [{ translateY: -radius }] }
              ]}>
                <View style={[
                  styles.slotBox,
                  { borderColor: color }
                ]}>
                  <Text style={[
                    styles.slotText,
                    { color: color }
                  ]}>
                    {slot.label}
                  </Text>
                </View>
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
  content: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  segment: {
    position: 'absolute',
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
    backgroundColor: 'rgba(0,0,0,0.9)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 60,
    alignItems: 'center',
  },
  slotText: {
    fontWeight: '900',
    fontSize: 18,
  },
});

