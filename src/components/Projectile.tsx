import React, { memo, useEffect } from 'react';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  runOnJS,
  useAnimatedReaction,
  Easing
} from 'react-native-reanimated';
import { StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../constants/theme';
import { OrbitData } from '../utils/levelGenerator';

const { width, height } = Dimensions.get('window');

interface ProjectileProps {
  initialVelocity: { x: number; y: number };
  activeOrbitRadius: number;
  allOrbits: OrbitData[];
  activeOrbitIndex: number;
  onHit: (slotIndex: number) => void;
  onMiss: () => void;
  onWrongOrbit: () => void;
  orbitStartTime: number;
}

export const Projectile: React.FC<ProjectileProps> = memo(({ 
    initialVelocity, 
    activeOrbitIndex,
    allOrbits,
    onHit, 
    onMiss,
    onWrongOrbit,
    orbitStartTime
}) => {
  const posX = useSharedValue(0);
  const posY = useSharedValue(0);
  const progress = useSharedValue(0);
  const lastDist = useSharedValue(0);
  
  const checkedOrbits = useSharedValue<number[]>([]);

  useEffect(() => {
    // Projectile travels for 1.5 seconds at fixed speed
    progress.value = withTiming(1, { 
        duration: 1500, 
        easing: Easing.linear 
    }, (finished) => {
      if (finished) {
        runOnJS(onMiss)();
      }
    });
  }, []);

  useAnimatedReaction(
    () => progress.value,
    (p) => {
      // Speed multiplier - 800 units over 1.5s
      const tx = initialVelocity.x * p * 800;
      const ty = initialVelocity.y * p * 800;
      posX.value = tx;
      posY.value = ty;

      const currentDist = Math.sqrt(tx * tx + ty * ty);

      // Check off-screen
      if (Math.abs(tx) > width / 2 || Math.abs(ty) > height / 2) {
          return;
      }

      // Collision Detection
      allOrbits.forEach((orbit, idx) => {
        if (checkedOrbits.value.includes(idx)) return;

        // Crossing check: did we pass the orbit radius in this frame?
        // Add a tiny buffer (3 units) to the crossing check to be more robust against frame skipping
        const crossed = (lastDist.value < orbit.radius - 3 && currentDist >= orbit.radius - 3);

        if (crossed) {
            const angleRad = Math.atan2(tx, -ty);
            let angleDeg = (angleRad * 180 / Math.PI);
            if (angleDeg < 0) angleDeg += 360;

            // Sync with Orbit's internal rotation
            const now = new Date().getTime();
            const elapsed = now - orbitStartTime;
            const currentRotation = (orbit.initialRotation + (elapsed / orbit.rotationSpeed * 360)) % 360;

            // Deterministic segment calculation: Every shot is a hit
            // Calculate relative angle to the rotating orbit (rotated 360-degree space)
            const relativeAngle = (angleDeg - currentRotation + 360 + 60) % 360;
            const bestSlotIdx = Math.floor(relativeAngle / 120) % 3;

            if (idx === activeOrbitIndex) {
                // Hits on active orbit always apply the math op
                runOnJS(onHit)(bestSlotIdx);
                checkedOrbits.value = [...checkedOrbits.value, idx];
            } else {
                // Ghosting through other orbits - show warning but keep going
                runOnJS(onWrongOrbit)();
                checkedOrbits.value = [...checkedOrbits.value, idx];
            }
        }
      });

      lastDist.value = currentDist;
    }
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
        { translateX: posX.value },
        { translateY: posY.value },
        { rotate: `${Math.atan2(initialVelocity.x, -initialVelocity.y) * 180 / Math.PI}deg` }
    ],
  }));

  return (
    <Animated.View style={[styles.bullet, animatedStyle]} />
  );
});

const styles = StyleSheet.create({
  bullet: {
    position: 'absolute',
    width: 6,
    height: 15,
    backgroundColor: COLORS.primary,
    borderRadius: 3,
    shadowColor: COLORS.primary,
    shadowRadius: 10,
    shadowOpacity: 1,
    zIndex: 50,
  },
});
