# Math Orbit Hero: Setup Guide

Since this is for your main machine, follow these steps to run the game:

## 1. Create a new Expo Project
```bash
npx create-expo-app@latest MathOrbitHero --template blank-typescript
cd MathOrbitHero
```

## 2. Install Dependencies
```bash
npx expo install react-native-reanimated react-native-gesture-handler zustand expo-haptics expo-linear-gradient lucide-react-native
```

## 3. Copy the Source Code
- Replace `App.tsx` with the provided code.
- Create a `src` folder and its subdirectories (`constants`, `store`, `components`).
- Copy the corresponding `.tsx` files into those folders.

## 4. Enable Reanimated Plugin
Make sure your `babel.config.js` looks like this:
```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

## 5. Start the Game
```bash
npx expo start
```

## Game Features Included:
- **Orbital Mechanics**: Rotating rings with math gates.
- **Hero System**: Animated rockets with value tracking.
- **Fail Mockery**: Ad-style fail screens with IQ insults.
- **Neon Aesthetic**: Custom design system for that 'premium' feel.
