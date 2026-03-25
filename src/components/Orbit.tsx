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

interface OrbitProps {
  radius: number;
  rotationSpeed: number; // ms per revolution
  gates: { value: string; angle: number }[];
  enemies: { value: number; angle: number }[];
}

export const Orbit: React.FC<OrbitProps> = ({ radius, rotationSpeed, gates, enemies }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: rotationSpeed, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={[styles.container, { width: radius * 2, height: radius * 2 }]}>
      <View style={[styles.ring, { width: radius * 2, height: radius * 2, borderRadius: radius }]} />
      <Animated.View style={[styles.content, animatedStyle]}>
        {gates.map((gate, i) => (
          <View key={`gate-${i}`} style={[
            styles.item, 
            { transform: [{ rotate: `${gate.angle}deg` }, { translateY: -radius }] }
          ]}>
            <View style={styles.gateBox}>
              <Text style={styles.gateText}>{gate.value}</Text>
            </View>
          </View>
        ))}
        {enemies.map((enemy, i) => (
          <View key={`enemy-${i}`} style={[
            styles.item, 
            { transform: [{ rotate: `${enemy.angle}deg` }, { translateY: -radius }] }
          ]}>
            <View style={styles.enemyBox}>
              <Text style={styles.enemyText}>{enemy.value}</Text>
            </View>
          </View>
        ))}
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
    borderWidth: 1,
    borderColor: COLORS.orbit,
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
    backgroundColor: COLORS.secondary,
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fff',
    elevation: 10,
  },
  gateText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  enemyBox: {
    backgroundColor: COLORS.danger,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fff',
  },
  enemyText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
