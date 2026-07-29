import { useEffect } from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import ViraLogo from './ViraLogo';

// Logo do Vira girando — substitui o ActivityIndicator genérico nos lugares
// onde o app está "pensando" (Secretário, Resumo do dia, Quebrar tarefa, telas de
// carregamento...). Com `loop={false}` gira uma volta só, pra usar como entrada
// (ex: a logo do topo ao abrir o app).
export default function ViraLogoSpinner({ size = 18, loop = true }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (loop) {
      rotation.value = withRepeat(withTiming(360, { duration: 1100, easing: Easing.linear }), -1, false);
    } else {
      rotation.value = withTiming(360, { duration: 700, easing: Easing.inOut(Easing.cubic) });
    }
  }, [rotation, loop]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <ViraLogo size={size} />
    </Animated.View>
  );
}
