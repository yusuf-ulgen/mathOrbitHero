import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useGameStore } from '../store/useGameStore';
import { COLORS } from '../constants/theme';
import { ShoppingBag, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const COSTUMES = [
  { id: 'classic', name: 'Classic Hero', cost: 0, color: COLORS.primary },
  { id: 'neon', name: 'Neon Striker', cost: 500, color: '#00ff00' },
  { id: 'void', name: 'Void Walker', cost: 1200, color: '#ff00ff' },
  { id: 'plasma', name: 'Plasma Guard', cost: 2500, color: '#ff8800' },
];

export const ShopScreen = () => {
  const { gold, addGold } = useGameStore();

  const renderItem = ({ item }: { item: typeof COSTUMES[0] }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      <View style={[styles.preview, { backgroundColor: item.color }]} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.cost}>{item.cost === 0 ? 'DEFAULT' : `💰 ${item.cost}`}</Text>
      </View>
      <View style={styles.buyButton}>
        <Text style={styles.buyText}>{item.cost === 0 ? 'EQUIPPED' : 'BUY'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={[COLORS.background, '#1a1a2e']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SHOP</Text>
        <View style={styles.goldBadge}>
          <Text style={styles.goldText}>💰 {gold}</Text>
        </View>
      </View>

      <FlatList
        data={COSTUMES}
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
    color: '#FFD700',
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  preview: {
    width: 60,
    height: 60,
    borderRadius: 12,
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
  cost: {
    color: '#FFD700',
    marginTop: 4,
  },
  buyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buyText: {
    color: '#000',
    fontWeight: 'bold',
  }
});
