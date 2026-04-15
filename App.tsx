console.log("DEBUG: App.tsx module loading...");
import React, { useState, useCallback, useRef, memo } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Text,
  SafeAreaView,
  PanResponder,
  Animated as ReactNativeAnimated
} from 'react-native';
import { Hero } from './src/components/Hero';
import { Orbit } from './src/components/Orbit';
import { Meteor } from './src/components/Meteor';
import { Projectile } from './src/components/Projectile';
import { TutorialAlert } from './src/components/TutorialAlert';
import { useGameStore } from './src/store/useGameStore';
import { COLORS } from './src/constants/theme';
import * as Haptics from 'expo-haptics';
import { Rocket, Trophy, Play, Infinity as InfinityIcon } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const StarBackground = memo(() => {
  const stars = useRef(Array.from({ length: 50 }).map(() => ({
    top: Math.random() * height,
    left: Math.random() * width,
    size: Math.random() * 3,
    opacity: Math.random() * 0.8 + 0.2,
  }))).current;

  return (
    <View style={StyleSheet.absoluteFill}>
      {stars.map((star, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            borderRadius: star.size / 2,
            backgroundColor: COLORS.star,
            opacity: star.opacity,
          }}
        />
      ))}
    </View>
  );
});

export default function App() {
  console.log("DEBUG: App component rendering...");
  const {
    heroPower,
    currentLevelIndex,
    highScore,
    currentScore,
    gamePhase,
    gameMode,
    currentLevelData,
    activeOrbitIndex,
    startLevel,
    setGameMode,
    applyMathOp,
    nextOrbit,
    completeLevel,
    setGamePhase,
    resetToMenu,
    skipOrbit,
    showTutorialWarning,
    setShowTutorialWarning
  } = useGameStore();

  const [isShooting, setIsShooting] = useState(false);
  const [shotVector, setShotVector] = useState({ x: 0, y: 0 });
  const [activeProjectile, setActiveProjectile] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentDrag, setCurrentDrag] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const gamePhaseRef = useRef(gamePhase);
  const isShootingRef = useRef(isShooting);

  React.useEffect(() => {
    gamePhaseRef.current = gamePhase;
  }, [gamePhase]);

  React.useEffect(() => {
    isShootingRef.current = isShooting;
  }, [isShooting]);

  const orbitStartTime = useRef(Date.now());

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => gamePhaseRef.current === 'ORBIT_PHASE' && !isShootingRef.current,
      onPanResponderGrant: () => {
        setIsDragging(true);
      },
      onPanResponderMove: (_, gestureState) => {
        const dx = gestureState.dx;
        const dy = gestureState.dy;
        // Simplified drag: We only care about direction for the fixed arrow
        setCurrentDrag({ x: dx, y: dy });
      },
      onPanResponderRelease: (_, gestureState) => {
        setIsDragging(false);

        const dx = gestureState.dx;
        const dy = gestureState.dy;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 15) {
          // Normalized direction
          const nx = -dx / distance;
          const ny = -dy / distance;

          setShotVector({ x: nx, y: ny });
          setIsShooting(true);
          setActiveProjectile(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      },
    })
  ).current;

  const handleModeSelect = (mode: 'LEVEL' | 'INFINITY') => {
    setGameMode(mode);
    startLevel();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const fireShot = () => {
    if (gamePhase !== 'ORBIT_PHASE' || isShooting) return;

    setIsShooting(true);
    setActiveProjectile(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const onProjectileHit = useCallback((bestSlotIdx: number) => {
    setActiveProjectile(false);
    setIsShooting(false);

    if (!currentLevelData) return;

    const orbit = currentLevelData.orbits[activeOrbitIndex];
    const slot = orbit.slots[bestSlotIdx];
    applyMathOp(slot.op, slot.value);

    if (slot.op === '-' || slot.op === '/') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    nextOrbit();
    orbitStartTime.current = Date.now();
  }, [currentLevelData, activeOrbitIndex, nextOrbit, applyMathOp]);

  const onProjectileMiss = useCallback(() => {
    setActiveProjectile(false);
    setIsShooting(false);
    skipOrbit();
    orbitStartTime.current = Date.now();
  }, [skipOrbit]);

  const onMeteorCollision = () => {
    if (!currentLevelData) return;

    const isSuccess = heroPower >= currentLevelData.meteorHealth;
    completeLevel(isSuccess);
    Haptics.notificationAsync(isSuccess ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error);
  };

  // Render Screens
  if (gamePhase === 'MENU') {
    return (
      <View style={styles.container}>
        <StarBackground />
        <View style={styles.menuContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>MATH ORBIT</Text>
            <Text style={[styles.title, styles.heroTitle]}>HERO</Text>
          </View>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => handleModeSelect('LEVEL')}
          >
            <Play color="#fff" size={24} />
            <Text style={styles.menuButtonText}>BÖLÜM MODU ({currentLevelIndex})</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, { borderColor: COLORS.secondary }]}
            onPress={() => handleModeSelect('INFINITY')}
          >
            <InfinityIcon color="#fff" size={24} />
            <View style={{ marginLeft: 15 }}>
              <Text style={styles.menuButtonText}>SONSUZ MOD</Text>
              {highScore > 0 && <Text style={styles.highScoreLabel}>REKOR: {highScore}</Text>}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      currentLevelData?.isBoss && { backgroundColor: '#1a0033' } // Dark purple for Boss
    ]}>
      <StatusBar barStyle="light-content" />
      <StarBackground />
      {currentLevelData?.isBoss && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 0, 0, 0.05)' }]} />
      )}

      {/* HUD */}
      <SafeAreaView style={styles.hud}>
        <View style={styles.hudRow}>
          <View>
            <Text style={styles.hudLabel}>{gameMode === 'LEVEL' ? 'BÖLÜM' : 'REKOR'}</Text>
            <Text style={styles.hudValue}>{gameMode === 'LEVEL' ? currentLevelIndex : highScore}</Text>
          </View>

          <View style={styles.centralHud}>
            <Text style={styles.hudLabel}>KALAN YÖRÜNGE</Text>
            <View style={styles.orbitalCounter}>
              <Text style={styles.orbitalValue}>
                {currentLevelData ? Math.max(0, currentLevelData.orbits.length - activeOrbitIndex) : 0}
              </Text>
              <Rocket size={16} color={COLORS.primary} style={{ marginLeft: 5 }} />
            </View>
          </View>

          <View style={{ alignItems: 'flex-end', flex: 1 }}>
            <Text style={styles.hudLabel}>GÜÇ PUANI</Text>
            <Text style={[styles.hudValue, { color: COLORS.primary }]}>{heroPower}</Text>
          </View>
        </View>
      </SafeAreaView>

      <View
        {...panResponder.panHandlers}
        style={styles.gameArea}
      >
        {gamePhase === 'ORBIT_PHASE' && currentLevelData && (
          <Orbit
            key={activeOrbitIndex}
            radius={currentLevelData.orbits[activeOrbitIndex].radius}
            rotationSpeed={currentLevelData.orbits[activeOrbitIndex].rotationSpeed}
            slots={currentLevelData.orbits[activeOrbitIndex].slots}
            isActive={true}
            initialRotation={currentLevelData.orbits[activeOrbitIndex].initialRotation}
          />
        )}

        {gamePhase === 'METEOR_PHASE' && (
          <Meteor
            health={currentLevelData?.meteorHealth || 0}
            currentPower={heroPower}
            onCollision={onMeteorCollision}
          />
        )}

        <Hero
          value={heroPower}
          isShooting={isShooting}
          dragVector={isDragging ? currentDrag : null}
        />

        {activeProjectile && currentLevelData && (
          <Projectile
            initialVelocity={shotVector}
            activeOrbitRadius={currentLevelData.orbits[activeOrbitIndex].radius}
            allOrbits={currentLevelData.orbits}
            activeOrbitIndex={activeOrbitIndex}
            onHit={onProjectileHit}
            onMiss={onProjectileMiss}
            onWrongOrbit={() => setShowTutorialWarning(true)}
            orbitStartTime={orbitStartTime.current}
          />
        )}
      </View>

      {/* Input Overlay - Ensures touches are captured from anywhere */}
      {gamePhase === 'ORBIT_PHASE' && !isShooting && (
        <View
          {...panResponder.panHandlers}
          style={StyleSheet.absoluteFill}
        />
      )}

      <TutorialAlert
        visible={showTutorialWarning}
        onHide={() => setShowTutorialWarning(false)}
      />

      {/* Overlay Screens */}
      {(gamePhase === 'WIN' || gamePhase === 'GAME_OVER') && (
        <View style={styles.overlay}>
          <View style={styles.overlayBox}>
            <Trophy color={gamePhase === 'WIN' ? COLORS.success : COLORS.danger} size={64} />
            <Text style={styles.overlayTitle}>
              {gamePhase === 'WIN' ? 'TEBRİKLER!' : 'OUN BİTTİ'}
            </Text>
            <Text style={styles.overlaySub}>
              {gamePhase === 'WIN'
                ? `Bölüm ${currentLevelIndex} tamamlandı!`
                : `Göktaşı gücü (${currentLevelData?.meteorHealth}) senin gücünden (${heroPower}) fazlaydı.`}
            </Text>

            <TouchableOpacity
              style={[
                styles.overlayButton,
                { backgroundColor: gamePhase === 'WIN' ? COLORS.success : COLORS.danger }
              ]}
              onPress={() => gamePhase === 'WIN' ? startLevel() : resetToMenu()}
            >
              <Text style={styles.overlayButtonText}>
                {gamePhase === 'WIN' ? 'SIRADAKİ BÖLÜM' : 'MENÜYE DÖN'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  menuContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.primary,
    textShadowColor: COLORS.primary,
    textShadowRadius: 20,
    marginBottom: 5,
    textAlign: 'center',
  },
  heroTitle: {
    fontSize: 52,
    marginTop: -10,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(0,0,0,0.5)',
    marginBottom: 20,
  },
  menuButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  highScoreLabel: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  hud: {
    position: 'absolute',
    top: 50,
    width: '100%',
    paddingHorizontal: 25,
    zIndex: 300,
  },
  hudRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hudLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  hudValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
  },
  centralHud: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  orbitalCounter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  orbitalValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlayBox: {
    width: '85%',
    backgroundColor: '#111',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  overlayTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '900',
    marginTop: 20,
  },
  overlaySub: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: 16,
    marginTop: 10,
    marginBottom: 30,
    lineHeight: 22,
  },
  overlayButton: {
    width: '100%',
    padding: 18,
    borderRadius: 15,
    alignItems: 'center',
  },
  overlayButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
