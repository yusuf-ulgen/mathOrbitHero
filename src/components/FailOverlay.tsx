import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { 
  FadeIn, 
  FadeOut, 
  BounceIn, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming 
} from 'react-native-reanimated';
import { COLORS } from '../constants/theme';
import { useGameStore } from '../store/useGameStore';

const { width } = Dimensions.get('window');

const MOCK_MESSAGES = [
  "BRAIN 0?",
  "MY CAT PLAYS BETTER!",
  "99% FAIL!",
  "YOU ARE SO BAD AT MATH",
  "IQ: -50",
  "ARE YOU SERIOUS?",
  "TRY AGAIN, NOOB"
];

export const FailOverlay: React.FC = () => {
  const { resetGame, heroValue } = useGameStore();
  const randomMsg = MOCK_MESSAGES[Math.floor(Math.random() * MOCK_MESSAGES.length)];

  const glowStyle = useAnimatedStyle(() => ({
    opacity: withRepeat(withTiming(0.4, { duration: 500 }), -1, true),
  }));

  return (
    <Animated.View 
      entering={FadeIn} 
      exiting={FadeOut} 
      style={styles.container}
    >
      <View style={styles.blur} />
      
      <Animated.Text 
        entering={BounceIn.delay(200)} 
        style={styles.mockTitle}
      >
        {randomMsg}
      </Animated.Text>

      <Text style={styles.scoreText}>SCORE: {heroValue}</Text>

      <TouchableOpacity 
        onPress={resetGame} 
        style={styles.retryButton}
      >
        <Animated.View style={[styles.buttonGlow, glowStyle]} />
        <Text style={styles.retryText}>TRY AGAIN</Text>
      </TouchableOpacity>

      <View style={styles.adBait}>
        <Text style={styles.adText}>ONLY LEGENDS CAN REACH IQ 200</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.danger,
    opacity: 0.1,
  },
  mockTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.danger,
    textAlign: 'center',
    marginBottom: 40,
    textShadowColor: COLORS.danger,
    textShadowRadius: 20,
  },
  scoreText: {
    color: '#fff',
    fontSize: 24,
    marginBottom: 60,
  },
  retryButton: {
    paddingHorizontal: 50,
    paddingVertical: 15,
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    borderRadius: 30,
  },
  retryText: {
    color: COLORS.background,
    fontSize: 20,
    fontWeight: 'bold',
  },
  adBait: {
    position: 'absolute',
    bottom: 50,
  },
  adText: {
    color: '#ffff00',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
