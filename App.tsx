import React from 'react';
import { View } from 'react-native';
import { GameScreen } from './src/screens/GameScreen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  // Mock route for testing GameScreen without navigation
  const mockRoute = { params: { level: 1 } };
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GameScreen route={mockRoute} navigation={{ navigate: () => {}, goBack: () => {} } as any} />
    </GestureHandlerRootView>
  );
}

