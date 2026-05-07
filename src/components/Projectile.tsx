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
import { OrbitData } from '../utils/levelGenerator';
import { useGameStore } from '../store/useGameStore';

const PROJECTILE_COLOR = '#00f7ff';

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
  const destroyAsteroid = useGameStore(s => s.destroyAsteroid);
  const posX = useSharedValue(0);
  const posY = useSharedValue(0);
  const progress = useSharedValue(0);
  const lastDist = useSharedValue(0);

  const checkedOrbits = useSharedValue<number[]>([]);
  const meteorHitDone = useSharedValue(false);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: 1000,
      easing: Easing.out(Easing.quad)
    }, (finished) => {
      if (finished) {
        runOnJS(onMiss)();
      }
    });
  }, []);

  useAnimatedReaction(
    () => progress.value,
    (p) => {
      const tx = initialVelocity.x * p * 1200;
      const ty = initialVelocity.y * p * 1200;
      posX.value = tx;
      posY.value = ty;

      const currentDist = Math.sqrt(tx * tx + ty * ty);

      if (Math.abs(tx) > width || Math.abs(ty) > height) {
        return;
      }

      // Collision Detection (Only check the active orbit)
      const orbit = allOrbits[activeOrbitIndex];
      if (orbit && !checkedOrbits.value.includes(activeOrbitIndex)) {
        const now = new Date().getTime();
        const elapsed = now - orbitStartTime;
        const angleRad = Math.atan2(tx, -ty);
        let angleDeg = (angleRad * 180 / Math.PI);
        if (angleDeg < 0) angleDeg += 360;

        // 1. Asteroid Collision Check (Slightly before the orbit)
        const asteroidRadius = orbit.radius - 20;
        const crossedAsteroid = (lastDist.value <= asteroidRadius && currentDist >= asteroidRadius);

        if (crossedAsteroid && orbit.asteroids) {
          let hitAsteroid = false;
          let hitAsteroidIdx = -1;
          for (let i = 0; i < orbit.asteroids.length; i++) {
            const asteroid = orbit.asteroids[i];
            const cycle = 2 * asteroid.oscillationSpeed;
            const aElapsed = elapsed % cycle;
            const p = aElapsed < asteroid.oscillationSpeed 
              ? aElapsed / asteroid.oscillationSpeed 
              : 1 - (aElapsed - asteroid.oscillationSpeed) / asteroid.oscillationSpeed;
            
            const sineP = (1 - Math.cos(p * Math.PI)) / 2;
            const currentOsc = (sineP * asteroid.oscillationRange) - (asteroid.oscillationRange / 2);
            const currentAstAngle = (asteroid.angle + currentOsc + 360) % 360;
            
            let diff = Math.abs(angleDeg - currentAstAngle);
            if (diff > 180) diff = 360 - diff;
            
            if (diff <= asteroid.width / 2) {
              hitAsteroid = true;
              hitAsteroidIdx = i;
              break;
            }
          }

          if (hitAsteroid) {
            runOnJS(destroyAsteroid)(activeOrbitIndex, hitAsteroidIdx);
            runOnJS(onMiss)();
            checkedOrbits.value = [...checkedOrbits.value, activeOrbitIndex];
            return;
          }
        }

        // 2. Orbit Collision Check
        const crossedOrbit = (lastDist.value <= orbit.radius && currentDist >= orbit.radius);

        if (crossedOrbit) {
          const currentRotation = (orbit.initialRotation + (elapsed / orbit.rotationSpeed * 360)) % 360;
          const relativeAngle = (angleDeg - currentRotation + 360 + 60) % 360;
          const bestSlotIdx = Math.floor(relativeAngle / 120) % 3;

          runOnJS(onHit)(bestSlotIdx);
          checkedOrbits.value = [...checkedOrbits.value, activeOrbitIndex];
        }
      }

      // Meteor Collision Check
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
    backgroundColor: PROJECTILE_COLOR,
    borderRadius: 3,
    shadowColor: PROJECTILE_COLOR,
    shadowRadius: 10,
    shadowOpacity: 1,
    zIndex: 50,
  },
});
