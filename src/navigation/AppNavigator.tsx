import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { COLORS } from '../constants/theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const DummyScreen = ({ name }: { name: string }) => (
  <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ color: '#fff' }}>{name} Screen (Dummy)</Text>
  </View>
);

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0a0a14',
        },
      }}
    >
      <Tab.Screen name="Shop" children={() => <DummyScreen name="Shop" />} />
      <Tab.Screen name="Play" children={() => <DummyScreen name="Play" />} />
      <Tab.Screen name="Lab" children={() => <DummyScreen name="Lab" />} />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
