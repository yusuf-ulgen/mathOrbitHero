import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  PanResponder,
} from 'react-native';
import { useGameStore } from '../store/useGameStore';
import { generateLevel, LevelConfig } from '../utils/levelGenerator';
import { COLORS } from '../constants/theme';
import { Orbit } from '../components/Orbit';
import { Hero } from '../components/Hero';
import { Meteor } from '../components/Meteor';
import { Asteroid } from '../components/Asteroid';
import { BattleProjectile } from '../components/BattleProjectile';
import { ScreenShake, Explosion } from '../components/Effects';
import { Timer, Zap, Pause, Play, Home, RotateCcw } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

// Positions
const HERO_BOTTOM_Y = height - 200;    // Hero position in battle
const METEOR_TOP_Y = 120;              // Where meteor stops (from top of gameArea)
// Adjusted for center-aligned container
const PROJECTILE_START_Y = height / 2 - 130; 
const PROJECTILE_END_Y = -height / 2 + METEOR_TOP_Y + 45;

export const GameScreen = ({ route, navigation }: any) => {
  const { level } = route.params;
  const config = useRef<LevelConfig>(generateLevel(level)).current;

  const {
    heroPower,
    updateHeroPower,
    addGold,
    completeLevel,
    setGamePhase,
    gamePhase,
    levelsSinceLastDrop,
    incrementPityTimer,
    resetPityTimer,
    resetHeroPower,
    startLevel,
    meteorCurrentHealth,
    damageMeteor,
    destroyAsteroid
  } = useGameStore();

  const [levelStartTime, setLevelStartTime] = useState<number>(Date.now());

  const [timeLeft, setTimeLeft] = useState(30); // Default time limit
  const [activeOrbitIndex, setActiveOrbitIndex] = useState(0);
  const [orbitsLeft, setOrbitsLeft] = useState(config.orbits.length);
  const [shake, setShake] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(level === 1);
  const [pausedTime, setPausedTime] = useState(0);
  const [pauseStart, setPauseStart] = useState<number | null>(level === 1 ? Date.now() : null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTutorial, setShowTutorial] = useState(level === 1 || level === 3);

  // Slingshot State
  const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number, y: number } | null>(null);

  // Battle State
  const [battleShots, setBattleShots] = useState<number[]>([]);
  const [currentShotIndex, setCurrentShotIndex] = useState(-1);
  const [initialHeroPower, setInitialHeroPower] = useState(0); // Track power at battle start
  const [meteorArrived, setMeteorArrived] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);
  const [battleDone, setBattleDone] = useState(false);
  const shotsFiredRef = useRef(0);

  const [droppedSkill, setDroppedSkill] = useState<{ id: string, name: string, description: string } | null>(null);

  useEffect(() => {
    let timer: any;
    if (!isPaused && gamePhase === 'ORBIT_PHASE') {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            handleGameOver(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPaused, gamePhase]);

  const togglePause = () => {
    if (isPaused) {
      if (pauseStart) {
        setPausedTime(prev => prev + (Date.now() - pauseStart));
      }
      setPauseStart(null);
      setIsPaused(false);
    } else {
      setPauseStart(Date.now());
      setIsPaused(true);
    }
  };

  const battleTimeoutRef = useRef<any>(null);

  useEffect(() => {
    const now = Date.now();
    setLevelStartTime(now);
    startLevel(level);
    return () => {
      if (battleTimeoutRef.current) clearTimeout(battleTimeoutRef.current);
    };
  }, [level]);

  const handleGameOver = (success: boolean) => {
    if (success) {
      const goldEarned = Math.floor(score / 10);
      addGold(goldEarned);
    }
    completeLevel(success);
  };

  const isPausedRef = useRef(isPaused);
  const showTutorialRef = useRef(showTutorial);
  const gamePhaseRef = useRef(gamePhase);
  const dragStartRef = useRef<{ x: number, y: number } | null>(null);
  const dragCurrentRef = useRef<{ x: number, y: number } | null>(null);

  // Hero animated position
  const heroPos = useSharedValue(0);

  useEffect(() => {
    isPausedRef.current = isPaused;
    showTutorialRef.current = showTutorial;
    gamePhaseRef.current = gamePhase;

    if (gamePhase === 'METEOR_PHASE') {
      heroPos.value = withTiming(1, { duration: 600 });
    } else {
      heroPos.value = 0;
    }
  }, [isPaused, showTutorial, gamePhase]);

  const animatedHeroStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: heroPos.value * (height / 2 - 130) }
    ],
  }));

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => !isPausedRef.current && !showTutorialRef.current && gamePhaseRef.current === 'ORBIT_PHASE',
    onPanResponderGrant: (evt) => {
      const pos = { x: evt.nativeEvent.pageX, y: evt.nativeEvent.pageY };
      dragStartRef.current = pos;
      setDragStart(pos);
    },
    onPanResponderMove: (evt) => {
      const pos = { x: evt.nativeEvent.pageX, y: evt.nativeEvent.pageY };
      dragCurrentRef.current = pos;
      setDragCurrent(pos);
    },
    onPanResponderRelease: () => {
      handleShoot();
      dragStartRef.current = null;
      dragCurrentRef.current = null;
      setDragStart(null);
      setDragCurrent(null);
    }
  })).current;

  const handleShoot = () => {
    if (!dragStartRef.current || !dragCurrentRef.current || isPausedRef.current || isProcessing) return;
    setIsProcessing(true);

    const dx = dragCurrentRef.current.x - dragStartRef.current.x;
    const dy = dragCurrentRef.current.y - dragStartRef.current.y;

    const angle = Math.atan2(-dy, -dx);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const activeOrbit = config.orbits[activeOrbitIndex];
    if (!activeOrbit) return;

    const rotationPerMs = 360 / activeOrbit.rotationSpeed;
    const currentTime = isPaused && pauseStart ? pauseStart : Date.now();
    const elapsed = (currentTime - levelStartTime - pausedTime + activeOrbit.initialRotation * (activeOrbit.rotationSpeed / 360)) % activeOrbit.rotationSpeed;
    const currentRotation = (elapsed * rotationPerMs) % 360;

    let shotAngle = (angle * 180 / Math.PI + 90) % 360;
    if (shotAngle < 0) shotAngle += 360;

    // --- Asteroid Collision Check ---
    const gameTime = currentTime - levelStartTime - pausedTime;
    
    const hitAsteroidIdx = activeOrbit.asteroids.findIndex(asteroid => {
      const cycle = 2 * asteroid.oscillationSpeed;
      const aElapsed = gameTime % cycle;
      const p = aElapsed < asteroid.oscillationSpeed 
        ? aElapsed / asteroid.oscillationSpeed 
        : 1 - (aElapsed - asteroid.oscillationSpeed) / asteroid.oscillationSpeed;
      
      const sineP = (1 - Math.cos(p * Math.PI)) / 2;
      const currentOsc = (sineP * asteroid.oscillationRange) - (asteroid.oscillationRange / 2);
      const currentAstAngle = (asteroid.angle + currentOsc + 360) % 360;
      
      let diff = Math.abs(shotAngle - currentAstAngle);
      if (diff > 180) diff = 360 - diff;
      return diff <= asteroid.width / 2;
    });

    if (hitAsteroidIdx !== -1) {
      // Destroy asteroid
      destroyAsteroid(activeOrbitIndex, hitAsteroidIdx);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setShake(true);
      setTimeout(() => setShake(false), 200);
      setIsProcessing(false);
      return;
    }
    // --------------------------------

    // +60 degrees offset added to center the hit logic with visual slots
    const slotAngle = (shotAngle - currentRotation + 360 + 60) % 360;
    const hitIndex = Math.floor(slotAngle / 120) % 3;

    const slot = activeOrbit.slots[hitIndex];
    updateHeroPower(slot.label);

    setScore(s => s + 100);
    setShake(true);
    setTimeout(() => setShake(false), 200);

    if (activeOrbitIndex < config.orbits.length - 1) {
      setActiveOrbitIndex(prev => prev + 1);
      setOrbitsLeft(prev => prev - 1);
      setIsProcessing(false);
    } else {
      setOrbitsLeft(0);
      handleBattlePhase();
    }
  };

  const renderTrajectory = () => {
    if (!dragStart || !dragCurrent) return null;

    const dx = dragCurrent.x - dragStart.x;
    const dy = dragCurrent.y - dragStart.y;
    const dist = Math.min(Math.sqrt(dx * dx + dy * dy), 150);
    const angle = Math.atan2(-dy, -dx);

    return (
      <View style={[
        styles.trajectoryLine,
        {
          width: dist,
          transform: [
            { translateX: width / 2 },
            { translateY: height / 2 },
            { rotate: `${angle}rad` },
            { translateX: dist / 2 }
          ]
        }
      ]} />
    );
  };

  // ============== BATTLE PHASE ==============

  const handleBattlePhase = () => {
    setGamePhase('METEOR_PHASE');
    
    // Read the latest state
    const latestPower = useGameStore.getState().heroPower;
    const currentMeteorHealth = useGameStore.getState().meteorCurrentHealth;
    setInitialHeroPower(latestPower); // Store initial power
    
    // Safety: If for some reason hero power is huge, we use meteor health as base for shots
    // to ensure it hits exactly 0.
    const totalDamageToDeal = Math.min(latestPower, currentMeteorHealth);
    
    // If hero power is less than 10, use a single shot
    if (latestPower < 10) {
      setBattleShots([totalDamageToDeal]);
    } else {
      // Divide the power into 5 shots
      const perShot = Math.floor(totalDamageToDeal / 5);
      const remainder = totalDamageToDeal - perShot * 4;
      
      // If hero power is enough to kill, ensure the last shot deals the exact remainder
      const shots = [perShot, perShot, perShot, perShot, remainder];
      
      // If hero power is NOT enough, we still do 5 shots but meteor won't die (unless we buff shots)
      // To make it fun, if heroPower is close to health, we let them win
      if (latestPower >= currentMeteorHealth * 0.9) {
        // Close enough! Adjust shots to kill
        const adjustPerShot = Math.floor(currentMeteorHealth / 5);
        const adjustRemainder = currentMeteorHealth - adjustPerShot * 4;
        setBattleShots([adjustPerShot, adjustPerShot, adjustPerShot, adjustPerShot, adjustRemainder]);
      } else {
        setBattleShots(shots);
      }
    }
    
    setCurrentShotIndex(-1);
    setMeteorArrived(false);
    setShowExplosion(false);
    setBattleDone(false);
    shotsFiredRef.current = 0;
  };

  // When meteor arrives, start firing
  const onMeteorArrived = useCallback(() => {
    setMeteorArrived(true);
    // Start first shot after a short delay
    setTimeout(() => {
      setCurrentShotIndex(0);
    }, 400);
  }, []);

  // When a shot hits the meteor
  const onShotHit = useCallback((shotIndex: number) => {
    if (battleDone) return;
    
    const damage = battleShots[shotIndex];
    
    // Calculate what the health will be
    const currentHealth = useGameStore.getState().meteorCurrentHealth;
    const remainingHealth = Math.max(0, currentHealth - damage);
    
    // Apply damage to store
    damageMeteor(damage);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShake(true);
    setTimeout(() => setShake(false), 150);

    shotsFiredRef.current = shotIndex + 1;

    if (remainingHealth <= 0) {
      // Meteor destroyed! Show explosion IMMEDIATELY
      setBattleDone(true);
      setCurrentShotIndex(-1); // Stop firing
      setShowExplosion(true);
      
      // Safety fallback: If explosion doesn't signal completion, finish anyway
      setTimeout(() => {
        handleGameOver(true);
      }, 1500);
      return;
    }

    // Fire next shot if available
    if (shotIndex < battleShots.length - 1) {
      setTimeout(() => {
        setCurrentShotIndex(shotIndex + 1);
      }, 500); // Delay between shots
    } else {
      // All 5 shots fired, meteor still alive = FAIL
      setBattleDone(true);
      setTimeout(() => {
        handleGameOver(false);
      }, 800);
    }
  }, [battleShots, battleDone]);

  // Explosion complete = WIN
  const onExplosionComplete = useCallback(() => {
    handleGameOver(true);
  }, []);

  // ============== RENDER ==============

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <ScreenShake active={shake}>
        <View style={styles.hud}>
          <View style={styles.hudItem}>
            <Zap color={COLORS.primary} size={20} />
            <Text style={styles.hudText}>{heroPower}</Text>
          </View>
          <View style={styles.hudItem}>
            <Timer color={COLORS.secondary} size={20} />
            <Text style={[styles.hudText, timeLeft < 10 ? { color: COLORS.danger } : null]}>
              {timeLeft}s
            </Text>
          </View>
          <View style={styles.hudItem}>
            <Text style={styles.hudLabel}>LVL {level}</Text>
          </View>
          <TouchableOpacity style={styles.pauseButton} onPress={togglePause}>
            <Pause color="#fff" size={20} />
          </TouchableOpacity>
        </View>

        {gamePhase === 'ORBIT_PHASE' && (
          <View style={styles.orbitCounter}>
            <Text style={styles.counterText}>ORBITS: {orbitsLeft}</Text>
          </View>
        )}

        {gamePhase === 'METEOR_PHASE' && battleShots.length > 0 && (
          <View style={styles.shotCounter}>
            <Text style={styles.shotCounterText}>
              ATIŞ: {Math.min(shotsFiredRef.current + (currentShotIndex >= 0 ? 1 : 0), 5)} / 5
            </Text>
            <View style={styles.shotDots}>
              {battleShots.map((dmg, i) => (
                <View key={i} style={[
                  styles.shotDot,
                  i < shotsFiredRef.current ? styles.shotDotFired : 
                  i === currentShotIndex ? styles.shotDotActive : styles.shotDotPending,
                ]}>
                  <Text style={styles.shotDotText}>{dmg}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.gameArea}>
          {/* Orbits - only during orbit phase */}
          {gamePhase === 'ORBIT_PHASE' && config.orbits.map((orbit, idx) => (
            <Orbit
              key={idx}
              radius={orbit.radius}
              rotationSpeed={orbit.rotationSpeed}
              slots={orbit.slots}
              isActive={idx === activeOrbitIndex}
              initialRotation={orbit.initialRotation}
              isPaused={isPaused}
              asteroids={orbit.asteroids}
            />
          ))}
          
          {/* Hero */}
          <Animated.View style={[styles.heroContainer, animatedHeroStyle]}>
            <Hero
              value={heroPower}
              isShooting={dragStart !== null}
              dragVector={dragStart && dragCurrent ? { x: dragCurrent.x - dragStart.x, y: dragCurrent.y - dragStart.y } : null}
            />
          </Animated.View>

          {renderTrajectory()}

          {/* Meteor - stays until explosion starts */}
          {gamePhase === 'METEOR_PHASE' && !showExplosion && (
            <View style={styles.meteorContainer}>
              <Meteor 
                health={meteorCurrentHealth} 
                maxHealth={config.meteorHealth}
                onArrived={onMeteorArrived} 
              />
            </View>
          )}

          {/* Battle projectiles */}
          {currentShotIndex >= 0 && currentShotIndex < battleShots.length && meteorArrived && !battleDone && (
            <BattleProjectile
              key={`shot-${currentShotIndex}`}
              damage={battleShots[currentShotIndex]}
              startY={PROJECTILE_START_Y}
              endY={PROJECTILE_END_Y}
              onHit={() => onShotHit(currentShotIndex)}
            />
          )}

          {/* Explosion */}
          {showExplosion && (
            <View style={[styles.explosionContainer, { top: METEOR_TOP_Y + 50 }]}>
              <Explosion active={true} onComplete={onExplosionComplete} size={2.5} />
            </View>
          )}
        </View>

        {(gamePhase === 'WIN' || gamePhase === 'GAME_OVER') && (
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>
                {gamePhase === 'WIN' ? 'MISSION SUCCESS' : 'MISSION FAILED'}
              </Text>
              <Text style={styles.modalScore}>Score: {score}</Text>

              {droppedSkill && (
                <View style={styles.skillDrop}>
                  <Text style={styles.skillTitle}>NEW SKILL DROP!</Text>
                  <Text style={styles.skillName}>{droppedSkill.name}</Text>
                </View>
              )}

              <View style={styles.modalButtons}>
                {gamePhase === 'WIN' ? (
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: COLORS.primary }]}
                    onPress={() => navigation.replace('Game', { level: level + 1 })}
                  >
                    <Text style={[styles.buttonText, { color: '#000' }]}>SIRADAKİ BÖLÜM</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: COLORS.danger }]}
                    onPress={() => navigation.replace('Game', { level })}
                  >
                    <Text style={styles.buttonText}>TEKRAR DENE</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 10 }]}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.buttonText}>ANA MENÜ</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {isPaused && (
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>OYUN DURAKLATILDI</Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: COLORS.primary }]}
                  onPress={togglePause}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Play color="#000" size={20} style={{ marginRight: 10 }} />
                    <Text style={[styles.buttonText, { color: '#000' }]}>DEVAM ET</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 10 }]}
                  onPress={() => navigation.replace('Game', { level })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <RotateCcw color="#fff" size={20} style={{ marginRight: 10 }} />
                    <Text style={styles.buttonText}>YENİDEN BAŞLAT</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 10 }]}
                  onPress={() => navigation.goBack()}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Home color="#fff" size={20} style={{ marginRight: 10 }} />
                    <Text style={styles.buttonText}>ANA MENÜ</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {showTutorial && (
          <View style={styles.modalOverlay}>
            <View style={styles.tutorialBox}>
              <Text style={styles.tutorialTitle}>
                {level === 3 ? 'YENİ TEHLİKE!' : 'NASIL OYNANIR?'}
              </Text>
              
              {level === 1 ? (
                <>
                  <View style={styles.tutorialItem}>
                    <Text style={styles.tutorialEmoji}>🎯</Text>
                    <Text style={styles.tutorialText}>Ekrana basılı tutup geri çekerek nişan al ve fırlat!</Text>
                  </View>
                  <View style={styles.tutorialItem}>
                    <Text style={styles.tutorialEmoji}>💎</Text>
                    <Text style={styles.tutorialText}>Yörüngelerdeki matematik işlemlerini toplayarak gücünü artır.</Text>
                  </View>
                  <View style={styles.tutorialItem}>
                    <Text style={styles.tutorialEmoji}>👾</Text>
                    <Text style={styles.tutorialText}>Yeterli güce ulaştığında son aşamadaki meteoru yok et!</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.asteroidPreview}>
                    <Asteroid 
                      radius={0} 
                      angle={0} 
                      width={20} 
                      oscillationRange={40} 
                      oscillationSpeed={2000} 
                      isPaused={false} 
                    />
                  </View>
                  <View style={styles.tutorialItem}>
                    <Text style={styles.tutorialEmoji}>🪨</Text>
                    <Text style={styles.tutorialText}>Dikkat! Yörüngelerin önünde yüzen asteroidler belirdi.</Text>
                  </View>
                  <View style={styles.tutorialItem}>
                    <Text style={styles.tutorialEmoji}>🚫</Text>
                    <Text style={styles.tutorialText}>Onlara çarparsan atışın boşa gider. Zamanlamanı iyi ayarla!</Text>
                  </View>
                </>
              )}

              <TouchableOpacity
                style={styles.tutorialButton}
                onPress={() => {
                  setShowTutorial(false);
                  setIsPaused(false);
                  if (pauseStart) {
                    setPausedTime(prev => prev + (Date.now() - pauseStart));
                    setPauseStart(null);
                  }
                }}
              >
                <Text style={styles.buttonText}>ANLADIM!</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScreenShake>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  hud: {
    position: 'absolute',
    top: 60,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  hudItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minWidth: 100,
    justifyContent: 'center',
  },
  hudText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  hudLabel: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  orbitCounter: {
    position: 'absolute',
    top: 120,
    width: '100%',
    alignItems: 'center',
  },
  counterText: {
    color: COLORS.textSecondary,
    letterSpacing: 2,
    fontSize: 12,
  },
  shotCounter: {
    position: 'absolute',
    top: 120,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  shotCounterText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
    marginBottom: 8,
  },
  shotDots: {
    flexDirection: 'row',
    gap: 8,
  },
  shotDot: {
    width: 40,
    height: 30,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  shotDotPending: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  shotDotActive: {
    backgroundColor: 'rgba(0,247,255,0.3)',
    borderColor: COLORS.primary,
  },
  shotDotFired: {
    backgroundColor: 'rgba(0,255,170,0.3)',
    borderColor: COLORS.success,
  },
  shotDotText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContainer: {
    zIndex: 100,
  },
  trajectoryLine: {
    position: 'absolute',
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    opacity: 0.6,
  },
  meteorContainer: {
    position: 'absolute',
    top: METEOR_TOP_Y,
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
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modal: {
    width: '80%',
    backgroundColor: '#1a1a2e',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  modalScore: {
    color: COLORS.textSecondary,
    marginVertical: 10,
  },
  modalButtons: {
    flexDirection: 'column',
    marginTop: 20,
    width: '100%',
  },
  modalButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  skillDrop: {
    marginVertical: 20,
    padding: 15,
    borderRadius: 15,
    backgroundColor: 'rgba(0,255,255,0.1)',
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    width: '100%',
  },
  skillTitle: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  skillName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 5,
  },
  pauseButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tutorialBox: {
    width: '85%',
    backgroundColor: '#1a1a2e',
    borderRadius: 25,
    padding: 25,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  tutorialTitle: {
    color: COLORS.primary,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    letterSpacing: 1,
  },
  tutorialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    width: '100%',
    paddingHorizontal: 10,
  },
  tutorialEmoji: {
    fontSize: 24,
    marginRight: 15,
  },
  tutorialText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  tutorialButton: {
    backgroundColor: COLORS.primary,
    width: '100%',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  asteroidPreview: {
    height: 100,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
  }
});
