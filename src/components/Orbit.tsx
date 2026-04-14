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

<<<<<<< HEAD
interface Slice {
  operation: string;
  type: 'gate';
}

interface OrbitProps {
  radius: number;
  rotationSpeed: number;
  slices: Slice[];
  isActive: boolean;
}

export const Orbit: React.FC<OrbitProps> = ({ radius, rotationSpeed, slices, isActive }) => {
  const rotation = useSharedValue(0);
=======
interface OrbitProps {
  radius: number;
  rotationSpeed: number;
  slots: MathSlot[];
  isActive: boolean;
  initialRotation: number;
}

export const Orbit: React.FC<OrbitProps> = memo(({ radius, rotationSpeed, slots, isActive, initialRotation }) => {
  const rotation = useSharedValue(initialRotation);
>>>>>>> 9e0da47b4f159a8f31eb1bc220f72c2cbfbc5a2e

  useEffect(() => {
    rotation.value = initialRotation;
    rotation.value = withRepeat(
      withTiming(initialRotation + 360, { duration: rotationSpeed, easing: Easing.linear }),
      -1,
      false
    );
<<<<<<< HEAD
  }, [rotationSpeed]);
=======
  }, [rotationSpeed, initialRotation]);
>>>>>>> 9e0da47b4f159a8f31eb1bc220f72c2cbfbc5a2e

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
    opacity: isActive ? 1 : 0.3,
  }));

  return (
    <View style={[styles.container, { width: radius * 2, height: radius * 2 }]}>
      <View style={[
        styles.ring, 
        { 
          width: radius * 2, 
          height: radius * 2, 
          borderRadius: radius,
<<<<<<< HEAD
          borderColor: isActive ? COLORS.primary : 'rgba(255,255,255,0.1)',
          borderWidth: isActive ? 2 : 1,
        }
      ]} />
      <Animated.View style={[styles.content, animatedStyle]}>
        {slices.map((slice, i) => {
          const angle = i * 120;
          return (
            <View key={`slice-${i}`} style={[
              styles.item, 
              { transform: [{ rotate: `${angle}deg` }, { translateY: -radius }] }
            ]}>
              <View style={[
                styles.gateBox,
                isActive ? { borderColor: COLORS.primary } : null
              ]}>
                <Text style={styles.gateText}>{slice.operation}</Text>
=======
          borderColor: isActive ? COLORS.primary : COLORS.orbit,
          borderWidth: isActive ? 2 : 1,
          opacity: isActive ? 1 : 0.5,
        }
      ]} />
      
      <Animated.View style={[styles.content, animatedStyle]}>
        {slots.map((slot, i) => {
          const angle = i * 120; // 3 segments
          const isNegative = slot.op === '-' || slot.op === '/';
          const color = isNegative ? COLORS.danger : COLORS.success;
          
          return (
            <View key={`slot-${i}`} style={[
              styles.segment, 
              { transform: [{ rotate: `${angle}deg` }] }
            ]}>
              {/* Segment visual arc approximation */}
              <View style={[
                  styles.segmentArc, 
                  { borderColor: color, opacity: isActive ? 0.8 : 0.3 }
              ]} />
              
              <View style={[
                styles.item,
                { transform: [{ translateY: -radius }] }
              ]}>
                <View style={[
                  styles.slotBox,
                  { borderColor: color, shadowColor: color }
                ]}>
                  <Text style={[
                    styles.slotText,
                    { color: color }
                  ]}>
                    {slot.label}
                  </Text>
                </View>
>>>>>>> 9e0da47b4f159a8f31eb1bc220f72c2cbfbc5a2e
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
<<<<<<< HEAD
=======
    borderWidth: 1,
>>>>>>> 9e0da47b4f159a8f31eb1bc220f72c2cbfbc5a2e
    position: 'absolute',
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
  segmentArc: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 1000,
    borderWidth: 6,
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    // The bottom border acts as the arc
    transform: [{ rotate: '180deg' }], 
  },
  item: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
<<<<<<< HEAD
  gateBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  gateText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 18,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
=======
  slotBox: {
    backgroundColor: 'rgba(0,0,0,0.9)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 60,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  slotText: {
    fontWeight: '900',
    fontSize: 18,
    textShadowRadius: 10,
>>>>>>> 9e0da47b4f159a8f31eb1bc220f72c2cbfbc5a2e
  },
});

