import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useGameStore } from '../store/useGameStore';
import { COLORS } from '../constants/theme';
import { Beaker, ArrowUpCircle, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const SKILLS = [
  { id: 'time', name: 'Time Warp', description: '+5s Time Limit', baseCost: 200 },
  { id: 'power', name: 'Starting Surge', description: '+5 Starting Power', baseCost: 250 },
  { id: 'gold', name: 'Gold Rush', description: '+10% Gold from Score', baseCost: 300 },
  { id: 'crit', name: 'Crit Strike', description: '5% chance for 2x power', baseCost: 500 },
];

export const LabScreen = () => {
  const { gold, unlockedSkills, skillLevels, upgradeSkill } = useGameStore();

  const renderItem = ({ item }: { item: typeof SKILLS[0] }) => {
    const isUnlocked = unlockedSkills.includes(item.id);
    const level = skillLevels[item.id] || 0;
    const upgradeCost = item.baseCost * (level + 1);

    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.iconContainer}>
            {isUnlocked ? <Beaker color={COLORS.secondary} size={24} /> : <Lock color="#666" size={24} />}
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.desc}>{item.description}</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>LVL {level}</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[styles.upgradeButton, (!isUnlocked || gold < upgradeCost) ? styles.disabledButton : null]}
          disabled={!isUnlocked || gold < upgradeCost}
          onPress={() => upgradeSkill(item.id)}
        >
          <Text style={styles.upgradeText}>
            {isUnlocked ? `UPGRADE (💰${upgradeCost})` : 'LOCKED'}
          </Text>
          {isUnlocked && <ArrowUpCircle color="#000" size={16} style={{ marginLeft: 8 }} />}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <LinearGradient colors={[COLORS.background, '#1a1a2e']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>LABORATORY</Text>
        <View style={styles.goldBadge}>
          <Text style={styles.goldText}>💰 {gold}</Text>
        </View>
      </View>

      <FlatList
        data={SKILLS}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
      />
    </LinearGradient>
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
    marginBottom: 20,
  },
  title: {
    color: COLORS.secondary,
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  goldBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  goldText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  list: {
    padding: 20,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 15,
  },
  name: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  desc: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 2,
  },
  levelBadge: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  levelText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  upgradeButton: {
    backgroundColor: COLORS.secondary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
  },
  disabledButton: {
    backgroundColor: '#333',
  },
  upgradeText: {
    color: '#000',
    fontWeight: 'bold',
  }
});
