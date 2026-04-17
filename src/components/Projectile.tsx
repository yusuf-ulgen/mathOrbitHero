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
  onMeteorHit?: () => void;
  orbitStartTime: number;
}

export const Projectile: React.FC<ProjectileProps> = memo(({ 
    initialVelocity, 
    activeOrbitIndex,
    allOrbits,
    onHit, 
    onMiss,
    onWrongOrbit,
    onMeteorHit,
    orbitStartTime
}) => {
  const posX = useSharedValue(0);
  const posY = useSharedValue(0);
  const progress = useSharedValue(0);
  const lastDist = useSharedValue(0);
  
  const checkedOrbits = useSharedValue<number[]>([]);
  const meteorHitDone = useSharedValue(false);

  useEffect(() => {
    // Projectile travels for 0.5 seconds for much faster hit (eliminates 'deviation' input lag)
    progress.value = withTiming(1, { 
        duration: 500, 
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

      // Check off-screen (Use large bounds so it never cuts off large orbits)
      if (Math.abs(tx) > width || Math.abs(ty) > height) {
          return;
      }

      // Collision Detection (Only check the active orbit)
      const orbit = allOrbits[activeOrbitIndex];
      if (orbit && !checkedOrbits.value.includes(activeOrbitIndex)) {
        // Crossing check: check if the radius is between last and current distance
        const crossed = (lastDist.value <= orbit.radius && currentDist >= orbit.radius) || 
                        (lastDist.value >= orbit.radius && currentDist <= orbit.radius);

        if (crossed) {
            const angleRad = Math.atan2(tx, -ty);
            let angleDeg = (angleRad * 180 / Math.PI);
            if (angleDeg < 0) angleDeg += 360;

            const now = new Date().getTime();
            const elapsed = now - orbitStartTime;
            const currentRotation = (orbit.initialRotation + (elapsed / orbit.rotationSpeed * 360)) % 360;

            const relativeAngle = (angleDeg - currentRotation + 360 + 60) % 360;
            const bestSlotIdx = Math.floor(relativeAngle / 120) % 3;

            runOnJS(onHit)(bestSlotIdx);
            checkedOrbits.value = [...checkedOrbits.value, activeOrbitIndex];
        }
      }

      // Meteor Collision Check (Simple distance-based check)
      if (onMeteorHit && !meteorHitDone.value) {
        const meteorPosY = -150; 
        const distToMeteor = Math.sqrt(tx * tx + (ty - meteorPosY) * (ty - meteorPosY));
        
        if (distToMeteor < 50) { 
          meteorHitDone.value = true;
          runOnJS(onMeteorHit)();
        }
      }

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
