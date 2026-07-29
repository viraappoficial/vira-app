import { useEffect } from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import ViraLogo from './ViraLogo';

// Logo do Vira girando — substitui o ActivityIndicator genérico nos lugares
// onde o app está "pensando" (Secretário, Resumo do dia, Quebrar tarefa...).
export default function ViraLogoSpinner({ size = 18 }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 1100, easing: Easing.linear }), -1, false);
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <ViraLogo size={size} />
    </Animated.View>
  );
}
