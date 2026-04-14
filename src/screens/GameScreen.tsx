import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Dimensions, 
  PanResponder,
  Animated as RNAnimated
} from 'react-native';
import { useGameStore } from '../store/useGameStore';
import { generateLevel, LevelConfig } from '../utils/levelGenerator';
import { COLORS } from '../constants/theme';
import { Orbit } from '../components/Orbit';
import { Hero } from '../components/Hero';
import { ScreenShake } from '../components/Effects';
import { ArrowLeft, Timer, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

export const GameScreen = ({ route, navigation }: any) => {
  const { level } = route.params;
  const config = useRef<LevelConfig>(generateLevel(level)).current;
  
  const { 
    heroPower, 
    updateHeroPower, 
    addGold, 
    progressLevel, 
    setGameState,
    gameState 
  } = useGameStore();

  const [timeLeft, setTimeLeft] = useState(config.timeLimit);
  const [activeOrbitIndex, setActiveOrbitIndex] = useState(0);
  const [orbitalsLeft, setOrbitalsLeft] = useState(config.orbitals.length);
  const [shake, setShake] = useState(false);
  const [score, setScore] = useState(0);

  // Slingshot State
  const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number, y: number } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          handleGameOver('FAILED');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleGameOver = (state: 'WIN' | 'FAILED') => {
    if (state === 'WIN') {
        const goldEarned = Math.floor(score / 10);
        addGold(goldEarned);
        progressLevel();
    }
    setGameState(state);
    // navigation.pop(); // Handled by modals later
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      setDragStart({ x: evt.nativeEvent.pageX, y: evt.nativeEvent.pageY });
    },
    onPanResponderMove: (evt) => {
      setDragCurrent({ x: evt.nativeEvent.pageX, y: evt.nativeEvent.pageY });
    },
    onPanResponderRelease: () => {
      if (dragStart && dragCurrent) {
        handleShoot();
      }
      setDragStart(null);
      setDragCurrent(null);
    }
  });

  const handleShoot = () => {
    if (!dragStart || !dragCurrent) return;

    const dx = dragCurrent.x - dragStart.x;
    const dy = dragCurrent.y - dragStart.y;
    
    // Shoot in opposite direction
    const angle = Math.atan2(-dy, -dx);
    const speed = Math.sqrt(dx * dx + dy * dy) / 10;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Simulate projectile movement and collision
    // For now, we'll use a simple "timed" collision check
    // In a full implementation, we'd use a Projectile component with its own animation
    
    const activeOrbit = config.orbitals[activeOrbitIndex];
    if (!activeOrbit) return;

    // Determine which slice is currently at the collision point
    // We assume the collision happens at the 'top' (0 degrees relative to center)
    // We need to account for orbital rotation
    const rotationPerMs = 360 / activeOrbit.rotationSpeed;
    const elapsed = Date.now() % activeOrbit.rotationSpeed;
    const currentRotation = (elapsed * rotationPerMs) % 360;
    
    // Normalize target angle (where we shot)
    let shotAngle = (angle * 180 / Math.PI + 90) % 360;
    if (shotAngle < 0) shotAngle += 360;

    // Calculate which slice was at shotAngle
    // Slice 0 is at 0 deg, Slice 1 at 120, Slice 2 at 240
    // But they are rotated by currentRotation
    const sliceAngle = (shotAngle - currentRotation + 360) % 360;
    const hitIndex = Math.floor(sliceAngle / 120) % 3;
    
    const op = activeOrbit.slices[hitIndex].operation;
    updateHeroPower(op);
    setScore(s => s + 100);
    setShake(true);
    setTimeout(() => setShake(false), 200);

    if (activeOrbitIndex < config.orbitals.length - 1) {
      setActiveOrbitIndex(prev => prev + 1);
      setOrbitalsLeft(prev => prev - 1);
    } else {
      setOrbitalsLeft(0);
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

  const { levelsSinceLastDrop, incrementPityTimer, resetPityTimer } = useGameStore();
  const [droppedSkill, setDroppedSkill] = useState<{ id: string, name: string, description: string } | null>(null);

  const handleBattlePhase = () => {
    setGameState('BATTLE');
    setTimeout(() => {
       if (heroPower >= config.enemyHealth) {
          const rng = Math.random();
          const pityTriggered = levelsSinceLastDrop >= 20;
          if (rng < 0.1 || pityTriggered) {
             setDroppedSkill({ id: 'time', name: 'Time Warp', description: '+5s Time Limit' });
             resetPityTimer();
          } else {
             incrementPityTimer();
          }
          handleGameOver('WIN');
       } else {
          handleGameOver('FAILED');
       }
    }, 1000);
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <ScreenShake active={shake}>
        <View style={styles.hud}>
          <View style={styles.hudItem}>
            <View style={{ width: 20, height: 20, backgroundColor: COLORS.primary }} />
            <Text style={styles.hudText}>{heroPower}</Text>
          </View>
          <View style={styles.hudItem}>
            <View style={{ width: 20, height: 20, backgroundColor: COLORS.secondary }} />
            <Text style={[styles.hudText, timeLeft < 10 ? { color: COLORS.danger } : null]}>
              {timeLeft}s
            </Text>
          </View>
          <View style={styles.hudItem}>
            <Text style={styles.hudLabel}>LVL {level}</Text>
          </View>
        </View>

        <View style={styles.orbitCounter}>
            <Text style={styles.counterText}>ORBITALS: {orbitalsLeft}</Text>
        </View>

        <View style={styles.gameArea}>
          {config.orbitals.map((orbit, idx) => (
            <Orbit 
              key={idx}
              radius={orbit.radius}
              rotationSpeed={orbit.rotationSpeed}
              slices={orbit.slices}
              isActive={idx === activeOrbitIndex}
            />
          ))}
          <Hero value={heroPower} isDashing={dragStart !== null} />
          
          {renderTrajectory()}

          {gameState === 'BATTLE' && (
             <View style={styles.enemyContainer}>
                <Text style={styles.enemyHealth}>👾 {config.enemyHealth}</Text>
                <View style={styles.enemyShape} />
             </View>
          )}
        </View>

        {(gameState === 'WIN' || gameState === 'FAILED') && (
           <View style={styles.modalOverlay}>
              <View style={styles.modal}>
                 <Text style={styles.modalTitle}>
                    {gameState === 'WIN' ? 'MISSION SUCCESS' : 'MISSION FAILED'}
                 </Text>
                 <Text style={styles.modalScore}>Score: {score}</Text>
                 
                 {droppedSkill && (
                    <View style={styles.skillDrop}>
                       <Text style={styles.skillTitle}>NEW SKILL DROP!</Text>
                       <Text style={styles.skillName}>{droppedSkill.name}</Text>
                    </View>
                 )}

                 <View style={styles.modalButtons}>
                    <TouchableOpacity style={styles.modalButton} onPress={() => navigation.goBack()}>
                       <Text style={styles.buttonText}>MENU</Text>
                    </TouchableOpacity>
                    {gameState === 'WIN' ? (
                       <TouchableOpacity 
                         style={[styles.modalButton, { backgroundColor: COLORS.primary }]}
                         onPress={() => navigation.replace('Game', { level: level + 1 })}
                        >
                          <Text style={[styles.buttonText, { color: '#000' }]}>NEXT</Text>
                       </TouchableOpacity>
                    ) : (
                       <TouchableOpacity 
                         style={[styles.modalButton, { backgroundColor: COLORS.danger }]}
                         onPress={() => navigation.replace('Game', { level })}
                        >
                          <Text style={styles.buttonText}>RETRY</Text>
                       </TouchableOpacity>
                    )}
                 </View>
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
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trajectoryLine: {
    position: 'absolute',
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    opacity: 0.6,
  },
  enemyContainer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  enemyHealth: {
     color: COLORS.danger,
     fontSize: 24,
     fontWeight: 'bold',
     marginBottom: 10,
  },
  enemyShape: {
     width: 80,
     height: 80,
     backgroundColor: COLORS.danger,
     borderRadius: 20,
     borderWidth: 3,
     borderColor: '#fff',
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
     flexDirection: 'row',
     marginTop: 20,
     gap: 15,
  },
  modalButton: {
     flex: 1,
     paddingVertical: 12,
     borderRadius: 12,
     alignItems: 'center',
     backgroundColor: 'rgba(255,255,255,0.1)',
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
  }
});


