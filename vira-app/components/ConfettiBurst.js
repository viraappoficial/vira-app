import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, useWindowDimensions, View } from 'react-native';
import { COLORS } from '../lib/theme';

const PARTICLE_COLORS = [COLORS.accent, COLORS.concluido, COLORS.andamento, '#E86F9C', '#8E6FE8'];
const PARTICLE_COUNT = 16;

function Particle({ index, scale: burstScale }) {
  const progress = useRef(new Animated.Value(0)).current;
  const angle = (index / PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.5;
  const distance = (60 + Math.random() * 50) * burstScale;
  const dx = Math.cos(angle) * distance;
  const dy = Math.sin(angle) * distance - 20 * burstScale;
  const color = PARTICLE_COLORS[index % PARTICLE_COLORS.length];
  const isSquare = index % 2 === 0;
  const rotateDeg = 180 + Math.random() * 360;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 700 + Math.random() * 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress]);

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, dx] });
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, dy + 80] });
  const opacity = progress.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] });
  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${rotateDeg}deg`] });
  const scale = progress.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0.6] });

  return (
    <Animated.View
      style={[
        styles.particle,
        isSquare ? styles.square : styles.circle,
        {
          backgroundColor: color,
          opacity,
          transform: [{ translateX }, { translateY }, { rotate }, { scale }],
        },
      ]}
    />
  );
}

export default function ConfettiBurst({ burstKey, origin }) {
  const { width, height } = useWindowDimensions();
  if (!burstKey) return null;

  const referenceSize = 420;
  const scale = Math.max(0.7, Math.min(Math.min(width, height) / referenceSize, 2.2));
  const left = origin ? origin.x : width / 2;
  const top = origin ? origin.y : height / 2;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <View style={[styles.origin, { left, top }]}>
        {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
          <Particle key={`${burstKey}-${i}`} index={i} scale={scale} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3000,
  },
  origin: {
    position: 'absolute',
    width: 1,
    height: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
  },
  square: {
    borderRadius: 2,
  },
  circle: {
    borderRadius: 4,
  },
});
