import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSequence, 
  withTiming, 
  withDelay,
  runOnJS
} from 'react-native-reanimated';
import { COLORS } from '../constants/theme';
import { Info } from 'lucide-react-native';

interface TutorialAlertProps {
  visible: boolean;
  onHide: () => void;
}

export const TutorialAlert: React.FC<TutorialAlertProps> = ({ visible, onHide }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    if (visible) {
      opacity.value = withSequence(
        withTiming(1, { duration: 300 }),
        withDelay(2000, withTiming(0, { duration: 300 }, (finished) => {
          if (finished) {
            runOnJS(onHide)();
          }
        }))
      );
      translateY.value = withSequence(
        withTiming(0, { duration: 300 }),
        withDelay(2000, withTiming(20, { duration: 300 }))
      );
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={[styles.alertBox, animatedStyle]}>
        <Info color={COLORS.secondary} size={20} />
        <Text style={styles.text}>Sadece size en yakın yörüngeye atış yapmalısınız</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 150,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 2000,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    maxWidth: '80%',
  },
  text: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
