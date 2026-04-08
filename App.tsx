import React, { useState, useCallback, useRef, memo } from 'react';
import { 
  StyleSheet, 
  View, 
  StatusBar, 
  TouchableOpacity, 
  Dimensions, 
  Text,
  SafeAreaView
} from 'react-native';
import { Hero } from './src/components/Hero';
import { Orbit } from './src/components/Orbit';
import { Meteor } from './src/components/Meteor';
import { Projectile } from './src/components/Projectile';
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
    resetToMenu
  } = useGameStore();

  const [isShooting, setIsShooting] = useState(false);
  const [activeProjectile, setActiveProjectile] = useState(false);
  const orbitStartTime = useRef(Date.now());

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

  const onProjectileHit = useCallback(() => {
    setActiveProjectile(false);
    setIsShooting(false);
    
    if (!currentLevelData) return;
    
    const orbit = currentLevelData.orbits[activeOrbitIndex];
    // Calculate which slot was hit based on timing
    const elapsed = Date.now() - orbitStartTime.current;
    const currentRotation = (elapsed / orbit.rotationSpeed * 360) % 360;
    
    // Slots are at 0, 120, 240 degrees. They rotate with the orbit.
    // Target hitting point is top (0 degrees).
    // The slot index that is closest to 0 degrees when rotated:
    // slotAngle = (i * 120 + currentRotation) % 360
    // We want slotAngle to be close to 360 or 0.
    
    let bestSlotIdx = 0;
    let minDiff = 360;
    
    for(let i=0; i<3; i++) {
        const slotAngle = (i * 120 + currentRotation) % 360;
        const diff = Math.min(Math.abs(slotAngle - 0), Math.abs(slotAngle - 360));
        if (diff < minDiff) {
            minDiff = diff;
            bestSlotIdx = i;
        }
    }

    const slot = orbit.slots[bestSlotIdx];
    applyMathOp(slot.op, slot.value);
    
    if (slot.op === '-' || slot.op === '/') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    nextOrbit();
    orbitStartTime.current = Date.now();
  }, [currentLevelData, activeOrbitIndex]);

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
          <Text style={styles.title}>MATH ORBIT HERO</Text>
          <Text style={styles.subtitle}>UZAYDA MATEMATİK SAVAŞI</Text>
          
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <StarBackground />
      
      {/* HUD */}
      <SafeAreaView style={styles.hud}>
        <View style={styles.hudRow}>
          <View>
            <Text style={styles.hudLabel}>{gameMode === 'LEVEL' ? 'BÖLÜM' : 'REKOR'}</Text>
            <Text style={styles.hudValue}>{gameMode === 'LEVEL' ? currentLevelIndex : highScore}</Text>
          </View>
          {gameMode === 'INFINITY' && (
            <View style={{ marginLeft: 20 }}>
              <Text style={styles.hudLabel}>SKOR</Text>
              <Text style={styles.hudValue}>{currentScore}</Text>
            </View>
          )}
          <View style={{ alignItems: 'flex-end', flex: 1 }}>
            <Text style={styles.hudLabel}>GÜÇ PUANI</Text>
            <Text style={[styles.hudValue, { color: COLORS.primary }]}>{heroPower}</Text>
          </View>
        </View>
      </SafeAreaView>

      <TouchableOpacity 
        activeOpacity={1} 
        onPress={fireShot} 
        style={styles.gameArea}
      >
        {gamePhase === 'ORBIT_PHASE' && currentLevelData?.orbits.map((orbit, idx) => (
          <Orbit 
            key={idx}
            radius={orbit.radius}
            rotationSpeed={orbit.rotationSpeed}
            slots={orbit.slots}
            isActive={idx === activeOrbitIndex}
          />
        ))}

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
        />

        {activeProjectile && currentLevelData && (
            <Projectile 
                targetRadius={currentLevelData.orbits[activeOrbitIndex].radius}
                onHit={onProjectileHit}
            />
        )}
      </TouchableOpacity>

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
                style={[styles.overlayButton, { backgroundColor: gamePhase === 'WIN' ? COLORS.success : COLORS.danger }]}
                onPress={() => gamePhase === 'WIN' ? startLevel(currentLevelIndex + 1) : resetToMenu()}
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
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    letterSpacing: 4,
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
