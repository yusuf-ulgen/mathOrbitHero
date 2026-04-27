import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useGameStore } from '../store/useGameStore';
import { COLORS } from '../constants/theme';
import { Rocket, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export const MapScreen = ({ navigation }: any) => {
  const { currentLevelIndex, gold } = useGameStore();

  const renderLevelNode = (levelNum: number) => {
    const isUnlocked = levelNum <= currentLevelIndex;
    const isCurrent = levelNum === currentLevelIndex;

    return (
      <View key={levelNum} style={styles.nodeWrapper}>
        <TouchableOpacity
          disabled={!isUnlocked}
          onPress={() => navigation.navigate('Game', { level: levelNum })}
          style={[
            styles.levelNode,
            !isUnlocked ? styles.lockedNode : null,
            isCurrent ? styles.currentNode : null
          ]}
        >
          {isUnlocked ? (
            <Text style={styles.levelText}>{levelNum}</Text>
          ) : (
            <View style={[styles.nodeWrapper, { width: 32, height: 32, backgroundColor: COLORS.primary }]} />
          )}
        </TouchableOpacity>
        {isCurrent && (
          <View style={styles.currentLabel}>
            <View style={{ width: 16, height: 16, backgroundColor: COLORS.primary }} />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <View style={styles.header}>
        <Text style={styles.title}>STAR MAP</Text>
        <View style={styles.goldBadge}>
          <Text style={styles.goldText}>💰 {gold}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {Array.from({ length: 100 }, (_, i) => 100 - i).map(renderLevelNode)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: COLORS.primary,
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  goldBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  goldText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  nodeWrapper: {
    marginVertical: 15,
    alignItems: 'center',
  },
  levelNode: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  lockedNode: {
    backgroundColor: '#333',
    borderColor: '#444',
    shadowOpacity: 0,
  },
  currentNode: {
    backgroundColor: COLORS.primary,
    borderColor: '#fff',
    transform: [{ scale: 1.2 }],
  },
  levelText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  currentLabel: {
    position: 'absolute',
    top: -20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 4,
    borderRadius: 10,
  }
});
