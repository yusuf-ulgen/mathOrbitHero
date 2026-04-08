import React, { memo, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing,
  runOnJS
} from 'react-native-reanimated';
import { COLORS } from '../constants/theme';
import { Shell } from 'lucide-react-native';

interface MeteorProps {
  health: number;
  currentPower: number;
  onCollision: () => void;
}

export const Meteor: React.FC<MeteorProps> = memo(({ health, currentPower, onCollision }) => {
  const translateY = useSharedValue(-400);

  useEffect(() => {
    translateY.value = withTiming(0, { 
      duration: 4000, 
      easing: Easing.linear 
    }, (finished) => {
      if (finished) {
        runOnJS(onCollision)();
      }
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const canBeDestroyed = currentPower >= health;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.meteorBody}>
        <Shell 
          size={80} 
          color={canBeDestroyed ? COLORS.warning : COLORS.danger} 
        />
        <View style={styles.healthTag}>
          <Text style={styles.healthText}>{health}</Text>
        </View>
        
        {/* Fire trail effect */}
        <View style={styles.trail} />
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  meteorBody: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    textShadowColor: COLORS.danger,
    textShadowRadius: 20,
  },
  healthTag: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
    top: -20,
  },
  healthText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 22,
  },
  trail: {
    position: 'absolute',
    width: 40,
    height: 100,
    backgroundColor: COLORS.danger,
    opacity: 0.3,
    bottom: 40,
    zIndex: -1,
    borderRadius: 20,
  },
});
