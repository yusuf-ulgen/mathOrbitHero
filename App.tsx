import React, { useState, useCallback, useRef, memo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Text,
  PanResponder,
  Animated as ReactNativeAnimated,
  BackHandler,
  Alert
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS
} from 'react-native-reanimated';
import { Hero } from './src/components/Hero';
import { Orbit } from './src/components/Orbit';
import { Meteor } from './src/components/Meteor';
import { Asteroid } from './src/components/Asteroid';
import { Projectile } from './src/components/Projectile';
import { Explosion } from './src/components/Effects';
import { TutorialAlert } from './src/components/TutorialAlert';
import { useGameStore } from './src/store/useGameStore';
import { COLORS } from './src/constants/theme';
import * as Haptics from 'expo-haptics';
import { Rocket, Trophy, Play, Home, RotateCcw } from 'lucide-react-native';

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
  const {
    heroPower,
    currentLevelIndex,
    meteorCurrentHealth,
    highScore,
    currentScore,
    gamePhase,
    gameMode,
    currentLevelData,
    activeOrbitIndex,
    levelCompleted,
    startLevel,
    setGameMode,
    applyMathOp,
    nextOrbit,
    completeLevel,
    setGamePhase,
    resetToMenu,
    skipOrbit,
    damageMeteor,
    resetProgress,
    showTutorialWarning,
    setShowTutorialWarning
  } = useGameStore();

  const [activeProjectile, setActiveProjectile] = useState(false);
  const [shotVector, setShotVector] = useState({ x: 0, y: -1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentDrag, setCurrentDrag] = useState({ x: 0, y: 0 });
  const [showExitModal, setShowExitModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true); // Show tutorial on first level

  // New Battle Phase State
  const [battleShots, setBattleShots] = useState<number[]>([]);
  const [currentShotIndex, setCurrentShotIndex] = useState(-1);
  const [initialHeroPower, setInitialHeroPower] = useState(0); // Added to track power at battle start
  const [meteorArrived, setMeteorArrived] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);
  const [battleDone, setBattleDone] = useState(false);
  const shotsFiredRef = useRef(0);

  const gamePhaseRef = useRef(gamePhase);
  const isShootingRef = useRef(activeProjectile);

  React.useEffect(() => {
    gamePhaseRef.current = gamePhase;
  }, [gamePhase]);

  React.useEffect(() => {
    isShootingRef.current = activeProjectile;
  }, [activeProjectile]);

  // Handle Battle Phase Initiation
  React.useEffect(() => {
    if (gamePhase === 'METEOR_PHASE') {
      const latestPower = useGameStore.getState().heroPower;
      const currentHealth = useGameStore.getState().meteorCurrentHealth;
      setInitialHeroPower(latestPower); // Store initial power for game over screen

      // Calculate shots to kill or deal max damage
      const totalToDeal = Math.min(latestPower, currentHealth);

      // If hero has less than 10 power, use a single shot
      if (latestPower < 10) {
        setBattleShots([totalToDeal]);
      } else {
        // Divide into 5 shots
        const perShot = Math.floor(totalToDeal / 5);
        const remainder = totalToDeal - perShot * 4;
        setBattleShots([perShot, perShot, perShot, perShot, remainder]);
      }

      setCurrentShotIndex(-1);
      setMeteorArrived(false);
      setShowExplosion(false);
      setBattleDone(false);
      shotsFiredRef.current = 0;
    }
  }, [gamePhase]);

  // Hero animated position
  const heroPos = useSharedValue(0);

  useEffect(() => {
    if (gamePhase === 'METEOR_PHASE') {
      heroPos.value = withTiming(1, { duration: 600 });
    } else {
      heroPos.value = 0;
    }
  }, [gamePhase]);

  const animatedHeroStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: heroPos.value * (height / 2 - 130) }
    ],
  }));

  // Back Handler logic
  React.useEffect(() => {
    const backAction = () => {
      if (gamePhase === 'MENU') {
        // On menu, standard behavior (exit)
        return false;
      }

      if (gamePhase === 'ORBIT_PHASE' || gamePhase === 'METEOR_PHASE') {
        setShowExitModal(true);
        return true;
      }

      if (gamePhase === 'WIN' || gamePhase === 'GAME_OVER') {
        resetToMenu();
        return true;
      }

      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [gamePhase, resetToMenu]);

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
          setActiveProjectile(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      },
    })
  ).current;

  const handleModeSelect = (mode: 'LEVEL') => {
    setGameMode(mode);
    orbitStartTime.current = Date.now();
    startLevel();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const fireShot = () => {
    if (gamePhase !== 'ORBIT_PHASE' || activeProjectile) return;

    setShotVector({ x: 0, y: -1 });
    setActiveProjectile(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const onProjectileHit = useCallback((bestSlotIdx: number) => {
    setActiveProjectile(false);

    // Don't apply math during meteor battle phase
    if (gamePhaseRef.current !== 'ORBIT_PHASE') return;

    if (!currentLevelData) return;

    const orbit = currentLevelData.orbits[activeOrbitIndex];
    
    // --- Asteroid Collision Check ---
    const currentTime = Date.now();
    const gameTime = currentTime - orbitStartTime.current;
    
    const hitAsteroid = orbit.asteroids && orbit.asteroids.some(asteroid => {
      const cycle = 2 * asteroid.oscillationSpeed;
      const elapsed = gameTime % cycle;
      const p = elapsed < asteroid.oscillationSpeed 
        ? elapsed / asteroid.oscillationSpeed 
        : 1 - (elapsed - asteroid.oscillationSpeed) / asteroid.oscillationSpeed;
      
      const sineP = (1 - Math.cos(p * Math.PI)) / 2;
      const currentOsc = (sineP * asteroid.oscillationRange) - (asteroid.oscillationRange / 2);
      const currentAstAngle = (asteroid.angle + currentOsc + 360) % 360;

      // In App.tsx, the projectile hit logic is slightly different
      // It uses a physical projectile. We need to check if the projectile hit an asteroid
      // However, for simplicity and consistency with the instant hit logic requested, 
      // we can check if there was an asteroid at the shot angle.
      // But App.tsx uses Projectile component which handles hits.
      return false; // We will handle this inside Projectile or here if we change how Projectile works
    });
    // NOTE: In App.tsx, the hit detection is actually inside the Projectile component!
    // I need to check Projectile.tsx too.

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
    if (gamePhaseRef.current === 'ORBIT_PHASE') {
      skipOrbit();
    }
    orbitStartTime.current = Date.now();
  }, [skipOrbit]);

  const onMeteorArrived = useCallback(() => {
    // Only set arrived to true, don't start firing immediately to give user a breath
    setMeteorArrived(true);

    // Give 1.5 seconds of cinematic pause before first shot starts
    setTimeout(() => {
      if (gamePhaseRef.current === 'METEOR_PHASE') {
        setCurrentShotIndex(0);
      }
    }, 1500);
  }, []);

  const onMeteorHit = useCallback(() => {
    if (battleDone) return;

    const damage = battleShots[currentShotIndex];
    const currentHealth = useGameStore.getState().meteorCurrentHealth;
    const remainingHealth = Math.max(0, currentHealth - damage);

    setActiveProjectile(false);
    damageMeteor(damage);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    shotsFiredRef.current = currentShotIndex + 1;

    if (remainingHealth <= 0) {
      setBattleDone(true);
      setShowExplosion(true);
      // Success fallback
      setTimeout(() => completeLevel(true), 1500);
      return;
    }

    // Next shot
    if (currentShotIndex < battleShots.length - 1) {
      setTimeout(() => {
        setCurrentShotIndex(currentShotIndex + 1);
      }, 500);
    } else {
      setBattleDone(true);
      setTimeout(() => completeLevel(false), 800);
    }
  }, [battleDone, battleShots, currentShotIndex, damageMeteor, completeLevel]);

  useEffect(() => {
    if (currentShotIndex >= 0 && meteorArrived && !battleDone) {
      setShotVector({ x: 0, y: -1 });
      setActiveProjectile(true);
    }
  }, [currentShotIndex, meteorArrived, battleDone]);

  // Render Screens
  if (gamePhase === 'MENU') {
    return (
      <SafeAreaProvider>
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
              <Text style={styles.menuButtonText}>OYUNA BAŞLA (Bölüm {currentLevelIndex})</Text>
            </TouchableOpacity>

          </View>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
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
          {/* Home Button */}
          <TouchableOpacity onPress={() => setShowExitModal(true)} style={styles.hudHomeSection}>
            <Home color={COLORS.primary} size={24} />
          </TouchableOpacity>

          {/* Level Section */}
          <View style={styles.hudSection}>
            <Text style={styles.hudLabel}>BÖLÜM</Text>
            <Text style={styles.hudValue}>{currentLevelIndex}</Text>
          </View>

          {/* Orbits Section */}
          <View style={styles.hudSection}>
            <Text style={styles.hudLabel}>KALAN YÖRÜNGE</Text>
            <View style={styles.orbitalCounter}>
              <Text style={styles.orbitalValue}>
                {gamePhase === 'METEOR_PHASE' || gamePhase === 'WIN' || gamePhase === 'GAME_OVER'
                  ? 0
                  : (currentLevelData ? Math.max(0, currentLevelData.orbits.length - activeOrbitIndex) : 0)}
              </Text>
              <Rocket size={14} color={COLORS.primary} style={{ marginLeft: 4 }} />
            </View>
          </View>

          {/* Power Section */}
          <View style={styles.hudSection}>
            <Text style={styles.hudLabel}>GÜÇ PUANI</Text>
            <Text style={styles.hudValue}>{heroPower}</Text>
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
              isPaused={false}
              asteroids={currentLevelData.orbits[activeOrbitIndex].asteroids}
            />
        )}

        {gamePhase === 'METEOR_PHASE' && !showExplosion && (
          <View style={styles.meteorContainer}>
            <Meteor
              health={meteorCurrentHealth}
              maxHealth={currentLevelData?.meteorHealth || 100}
              onArrived={onMeteorArrived}
            />
          </View>
        )}

        <Animated.View style={animatedHeroStyle}>
          <Hero
            value={heroPower}
            isShooting={activeProjectile}
            dragVector={isDragging ? currentDrag : null}
          />
        </Animated.View>

        {showExplosion && (
          <View style={[styles.explosionContainer, { top: 120 + 50 }]}>
            <Explosion active={true} onComplete={() => { }} />
          </View>
        )}

        {activeProjectile && currentLevelData && (
          <Projectile
            initialVelocity={shotVector}
            activeOrbitRadius={currentLevelData.orbits[activeOrbitIndex]?.radius || 0}
            allOrbits={currentLevelData.orbits}
            activeOrbitIndex={activeOrbitIndex}
            onHit={onProjectileHit}
            onMiss={onProjectileMiss}
            onMeteorHit={gamePhase === 'METEOR_PHASE' ? onMeteorHit : undefined}
            onWrongOrbit={() => setShowTutorialWarning(true)}
            orbitStartTime={orbitStartTime.current}
          />
        )}
      </View>

      {/* Input Overlay - Ensures touches are captured from anywhere */}
      {gamePhase === 'ORBIT_PHASE' && !activeProjectile && (
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
              {gamePhase === 'WIN' ? 'TEBRİKLER!' : 'OYUN BİTTİ'}
            </Text>
            <Text style={styles.overlaySub}>
              {gamePhase === 'WIN'
                ? `Bölüm ${currentLevelIndex} tamamlandı!`
                : `Göktaşı gücü (${currentLevelData?.meteorHealth}) senin gücünden (${initialHeroPower}) fazlaydı.`}
            </Text>

            <View style={{ width: '100%', gap: 12 }}>
              {gamePhase === 'GAME_OVER' && (
                <TouchableOpacity
                  style={[
                    styles.overlayButton,
                    { backgroundColor: COLORS.success }
                  ]}
                  onPress={() => {
                    orbitStartTime.current = Date.now();
                    startLevel();
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <RotateCcw color="#fff" size={22} style={{ marginRight: 12 }} />
                    <Text style={styles.overlayButtonText}>TEKRAR DENE</Text>
                  </View>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.overlayButton,
                  { backgroundColor: gamePhase === 'WIN' ? COLORS.success : COLORS.danger }
                ]}
                onPress={() => {
                  orbitStartTime.current = Date.now();
                  gamePhase === 'WIN' ? startLevel() : resetToMenu();
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {gamePhase === 'WIN' ? (
                    <Rocket color="#fff" size={22} style={{ marginRight: 12 }} />
                  ) : (
                    <Home color="#fff" size={22} style={{ marginRight: 12 }} />
                  )}
                  <Text style={styles.overlayButtonText}>
                    {gamePhase === 'WIN' ? 'SIRADAKİ BÖLÜM' : 'MENÜYE DÖN'}
                  </Text>
                </View>
              </TouchableOpacity>

              {gamePhase === 'WIN' && (
                <TouchableOpacity
                  style={[
                    styles.overlayButton,
                    { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }
                  ]}
                  onPress={() => resetToMenu()}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Home color="#fff" size={22} style={{ marginRight: 12 }} />
                    <Text style={styles.overlayButtonText}>ANA MENÜYE DÖN</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Tutorial Overlay - Shows on first level and level 3 */}
      {showTutorial && (currentLevelIndex <= 2 || currentLevelIndex === 3) && gamePhase === 'ORBIT_PHASE' && (
        <View style={styles.overlay}>
          <View style={styles.overlayBox}>
            <Text style={[styles.overlayTitle, { fontSize: 26 }]}>
              {currentLevelIndex === 3 ? 'YENİ TEHLİKE!' : 'NASIL OYNANIR?'}
            </Text>

            {currentLevelIndex <= 2 ? (
              <>
                <View style={styles.tutorialItem}>
                  <Text style={styles.tutorialEmoji}>🎯</Text>
                  <Text style={styles.tutorialDesc}>Ekrana basılı tut, geri çek ve bırak! Mermi yörüngeye doğru ateşlenir.</Text>
                </View>

                <View style={styles.tutorialItem}>
                  <Text style={styles.tutorialEmoji}>💎</Text>
                  <Text style={styles.tutorialDesc}>Yörüngelerdeki matematik işlemleri gücünü artırır veya azaltır. Yeşiller iyi, kırmızılar kötü!</Text>
                </View>

                <View style={styles.tutorialItem}>
                  <Text style={styles.tutorialEmoji}>☄️</Text>
                  <Text style={styles.tutorialDesc}>Tüm yörüngelerden geçtikten sonra meteora karşı savaşırsın. Gücün yeterliyse kazanırsın!</Text>
                </View>
              </>
            ) : (
              <>
                <View style={{ height: 100, width: '100%', justifyContent: 'center', alignItems: 'center', marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20 }}>
                  <Asteroid radius={0} angle={0} width={20} oscillationRange={40} oscillationSpeed={2000} isPaused={false} />
                </View>
                <View style={styles.tutorialItem}>
                  <Text style={styles.tutorialEmoji}>🪨</Text>
                  <Text style={styles.tutorialDesc}>Dikkat! Yörüngelerin önünde yüzen asteroidler belirdi.</Text>
                </View>
                <View style={styles.tutorialItem}>
                  <Text style={styles.tutorialEmoji}>🚫</Text>
                  <Text style={styles.tutorialDesc}>Onlara çarparsan atışın boşa gider. Zamanlamanı iyi ayarla!</Text>
                </View>
              </>
            )}

            <TouchableOpacity
              style={[styles.overlayButton, { backgroundColor: COLORS.primary, marginTop: 20 }]}
              onPress={() => setShowTutorial(false)}
            >
              <Text style={[styles.overlayButtonText, { color: '#000', fontWeight: '900' }]}>ANLADIM, BAŞLAYALIM!</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Exit Modal */}
      {showExitModal && (
        <View style={styles.overlay}>
          <View style={styles.overlayBox}>
            <Text style={styles.overlayTitle}>MENÜYE DÖN?</Text>
            <Text style={styles.overlaySub}>Emin misiniz? Mevcut ilerlemeniz kaybolacak.</Text>
            <View style={{ flexDirection: 'row', gap: 15, width: '100%' }}>
              <TouchableOpacity
                style={[styles.overlayButton, { flex: 1, backgroundColor: COLORS.orbit }]}
                onPress={() => setShowExitModal(false)}
              >
                <Text style={styles.overlayButtonText}>İPTAL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.overlayButton, { flex: 1, backgroundColor: COLORS.danger }]}
                onPress={() => { setShowExitModal(false); resetToMenu(); }}
              >
                <Text style={styles.overlayButtonText}>EVET</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      </View>
    </SafeAreaProvider>
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
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginTop: 10,
  },
  resetButtonText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginLeft: 8,
    letterSpacing: 0.5,
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
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  hudValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  },
  hudSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingVertical: 8,
    marginHorizontal: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  hudHomeSection: {
    width: 45,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    marginRight: 5,
  },
  homeButton: {
    marginRight: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 8,
    borderRadius: 12,
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
  tutorialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  tutorialEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  tutorialDesc: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  meteorContainer: {
    position: 'absolute',
    top: 120,
    width: '100%',
    alignItems: 'center',
    zIndex: 200,
  },
  explosionContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    zIndex: 300,
  },
});
