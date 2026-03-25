import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  StatusBar, 
  TouchableOpacity, 
  Dimensions, 
  Text 
} from 'react-native';
import { Hero } from './src/components/Hero';
import { Orbit } from './src/components/Orbit';
import { FailOverlay } from './src/components/FailOverlay';
import { useGameStore } from './src/store/useGameStore';
import { COLORS } from './src/constants/theme';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const ORBIT_STEPS = [
  { radius: 100, speed: 6000, gates: [{ value: 'x2', angle: 45 }], enemies: [{ value: 5, angle: 180 }] },
  { radius: 160, speed: 5000, gates: [{ value: '+50', angle: 220 }], enemies: [{ value: 25, angle: 10 }] },
  { radius: 220, speed: 4000, gates: [{ value: 'x10', angle: 120 }], enemies: [{ value: 200, angle: 270 }] },
  { radius: 280, speed: 3000, gates: [{ value: '/2', angle: 90 }, { value: '*3', angle: 0 }], enemies: [{ value: 1000, angle: 200 }] },
];

export default function App() {
  const { heroValue, currentOrbit, gameState, setGameState, nextOrbit, updateHeroValue } = useGameStore();
  const [isDashing, setIsDashing] = useState(false);

  const handlePress = () => {
    if (gameState === 'FAILED') return;
    if (gameState === 'START') {
      setGameState('PLAYING');
      return;
    }

    // Logic for jumping to next orbit
    setIsDashing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Simple collision check logic based on timing (simulated here)
    // Normally we'd use current rotation angle to check if we hit a gate
    setTimeout(() => {
      setIsDashing(false);
      
      // Randomly simulate hitting a gate vs enemy for the demo
      // In real implementation, we'd calculate intersection of Hero Y with items at rotation
      const outcome = Math.random();
      if (outcome > 0.8) {
        setGameState('FAILED');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        updateHeroValue('+10');
        nextOrbit();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }, 300);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.backgroundBlur} />
      
      {/* HUD */}
      <View style={styles.hud}>
        <Text style={styles.iqLabel}>BRAIN LEVEL</Text>
        <Text style={styles.iqValue}>{heroValue}</Text>
      </View>

      <TouchableOpacity 
        activeOpacity={1} 
        onPress={handlePress} 
        style={styles.gameArea}
      >
        {ORBIT_STEPS.map((orbit, idx) => (
          <Orbit 
            key={idx}
            radius={orbit.radius}
            rotationSpeed={orbit.speed}
            gates={orbit.gates}
            enemies={orbit.enemies}
          />
        ))}

        <Hero 
          value={heroValue} 
          isDashing={isDashing} 
        />
      </TouchableOpacity>

      {gameState === 'START' && (
        <View style={styles.startOverlay}>
          <Text style={styles.startText}>TAP TO START RAID</Text>
        </View>
      )}

      {gameState === 'FAILED' && <FailOverlay />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundBlur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.accent,
    opacity: 0.05,
  },
  hud: {
    position: 'absolute',
    top: 60,
    alignItems: 'center',
  },
  iqLabel: {
    color: COLORS.secondary,
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  iqValue: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '900',
  },
  gameArea: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startOverlay: {
    position: 'absolute',
    bottom: 100,
  },
  startText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    opacity: 0.6,
  },
});
