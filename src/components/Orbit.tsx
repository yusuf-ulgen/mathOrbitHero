import React, { useEffect, memo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing,
  cancelAnimation
} from 'react-native-reanimated';
import { COLORS } from '../constants/theme';
import { MathSlot, AsteroidData } from '../utils/levelGenerator';
import { Asteroid } from './Asteroid';
import { useGameStore } from '../store/useGameStore';

interface OrbitProps {
  radius: number;
  rotationSpeed: number;
  slots: MathSlot[];
  isActive: boolean;
  initialRotation: number;
  isPaused: boolean;
  asteroids: AsteroidData[];
}

export const Orbit: React.FC<OrbitProps> = memo(({ 
  radius, 
  rotationSpeed, 
  slots, 
  isActive, 
  initialRotation,
  isPaused,
  asteroids
}) => {
  const rotation = useSharedValue(initialRotation);
  const activeOrbitIndex = useGameStore(s => s.activeOrbitIndex);
  const destroyedAsteroids = useGameStore(s => s.destroyedAsteroids);

  const circumference = 2 * Math.PI * radius;
  const strokeDash = circumference / 3;

  useEffect(() => {
    if (isPaused) {
      cancelAnimation(rotation);
    } else {
      // Start or Resume animation
      // We animate from current value to current value + 360 to ensure a full loop
      rotation.value = withRepeat(
        withTiming(rotation.value + 360, { 
          duration: rotationSpeed, 
          easing: Easing.linear 
        }),
        -1,
        false
      );
    }
  }, [isPaused, rotationSpeed]); // Only re-run when pause state or speed changes

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
      
      {asteroids && asteroids.map((asteroid, i) => {
        const isDestroyed = destroyedAsteroids.includes(`${activeOrbitIndex}-${i}`);
        
        return (
          <Asteroid
            key={`asteroid-${i}`}
            radius={radius - 20}
            angle={asteroid.angle}
            width={asteroid.width}
            oscillationRange={asteroid.oscillationRange}
            oscillationSpeed={asteroid.oscillationSpeed}
            isPaused={isPaused}
            isDestroyed={isDestroyed}
          />
        );
      })}
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

