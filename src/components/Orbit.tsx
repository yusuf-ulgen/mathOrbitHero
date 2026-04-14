import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import { COLORS } from '../constants/theme';

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

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: rotationSpeed, easing: Easing.linear }),
      -1,
      false
    );
  }, [rotationSpeed]);

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
              </View>
            </View>
          );
        })}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
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
  },
});

