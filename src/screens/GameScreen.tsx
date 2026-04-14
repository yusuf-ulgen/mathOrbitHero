import React, { useState, useEffect, useRef } from 'react';
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
import { ScreenShake } from '../components/Effects';
import { Timer, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

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
    resetPityTimer
  } = useGameStore();

  const [timeLeft, setTimeLeft] = useState(30); // Default time limit
  const [activeOrbitIndex, setActiveOrbitIndex] = useState(0);
  const [orbitsLeft, setOrbitsLeft] = useState(config.orbits.length);
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
          handleGameOver(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleGameOver = (success: boolean) => {
    if (success) {
        const goldEarned = Math.floor(score / 10);
        addGold(goldEarned);
    }
    completeLevel(success);
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
    
    const angle = Math.atan2(-dy, -dx);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const activeOrbit = config.orbits[activeOrbitIndex];
    if (!activeOrbit) return;

    const rotationPerMs = 360 / activeOrbit.rotationSpeed;
    const elapsed = (Date.now() + activeOrbit.initialRotation * (activeOrbit.rotationSpeed / 360)) % activeOrbit.rotationSpeed;
    const currentRotation = (elapsed * rotationPerMs) % 360;
    
    let shotAngle = (angle * 180 / Math.PI + 90) % 360;
    if (shotAngle < 0) shotAngle += 360;

    const slotAngle = (shotAngle - currentRotation + 360) % 360;
    const hitIndex = Math.floor(slotAngle / 120) % 3;
    
    const slot = activeOrbit.slots[hitIndex];
    updateHeroPower(slot.label);
    
    setScore(s => s + 100);
    setShake(true);
    setTimeout(() => setShake(false), 200);

    if (activeOrbitIndex < config.orbits.length - 1) {
      setActiveOrbitIndex(prev => prev + 1);
      setOrbitsLeft(prev => prev - 1);
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

  const [droppedSkill, setDroppedSkill] = useState<{ id: string, name: string, description: string } | null>(null);

  const handleBattlePhase = () => {
    setGamePhase('METEOR_PHASE');
    setTimeout(() => {
       if (heroPower >= config.meteorHealth) {
          const rng = Math.random();
          const pityTriggered = levelsSinceLastDrop >= 20;
          if (rng < 0.1 || pityTriggered) {
             setDroppedSkill({ id: 'time', name: 'Time Warp', description: '+5s Time Limit' });
             resetPityTimer();
          } else {
             incrementPityTimer();
          }
          handleGameOver(true);
       } else {
          handleGameOver(false);
       }
    }, 1000);
  };

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
        </View>

        <View style={styles.orbitCounter}>
            <Text style={styles.counterText}>ORBITS: {orbitsLeft}</Text>
        </View>

        <View style={styles.gameArea}>
          {config.orbits.map((orbit, idx) => (
            <Orbit 
              key={idx}
              radius={orbit.radius}
              rotationSpeed={orbit.rotationSpeed}
              slots={orbit.slots}
              isActive={idx === activeOrbitIndex}
              initialRotation={orbit.initialRotation}
            />
          ))}
          <Hero 
            value={heroPower} 
            isShooting={dragStart !== null} 
            dragVector={dragStart && dragCurrent ? { x: dragCurrent.x - dragStart.x, y: dragCurrent.y - dragStart.y } : null}
          />
          
          {renderTrajectory()}

          {gamePhase === 'METEOR_PHASE' && (
             <View style={styles.enemyContainer}>
                <Text style={styles.enemyHealth}>👾 {config.meteorHealth}</Text>
                <View style={styles.enemyShape} />
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
                    <TouchableOpacity style={styles.modalButton} onPress={() => navigation.goBack()}>
                       <Text style={styles.buttonText}>MENU</Text>
                    </TouchableOpacity>
                    {gamePhase === 'WIN' ? (
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
