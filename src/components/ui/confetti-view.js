import React, { useEffect, useRef, memo, useMemo } from 'react';
import { Animated, Dimensions, Modal, StyleSheet, View } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// 7 distinct confetti colors
const CONFETTI_COLORS = [
  '#FF6B6B', // red-pink
  '#4ECDC4', // teal
  '#FFE66D', // yellow
  '#A8E063', // lime green
  '#C77DFF', // purple
  '#FF9F43', // orange
  '#48DBFB', // sky blue
];

const NUM_PARTICLES = 90;
const ANIMATION_DURATION_MS = 3200; // total window before onAnimationEnd fires

function buildParticleConfig(index) {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const size = 7 + Math.random() * 8;
  const isRect = Math.random() > 0.35;
  return {
    id: index,
    color,
    x: Math.random() * SCREEN_W,
    width: isRect ? size : size * 0.55,
    height: isRect ? size * 0.45 : size,
    borderRadius: isRect ? 2 : size / 2,
    driftX: (Math.random() - 0.5) * 140,
    delay: Math.floor(Math.random() * 400),
    duration: 2400 + Math.floor(Math.random() * 700),
    rotationDeg: 360 * (2 + Math.floor(Math.random() * 3)),
  };
}

// Individual particle – memoised to avoid re-renders
const Particle = memo(({ config }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const { delay, duration, driftX } = config;
    const fadeStart = Math.floor(duration * 0.72);
    const fadeDuration = duration - fadeStart;

    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_H + 40,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: driftX,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(fadeStart),
          Animated.timing(opacity, {
            toValue: 0,
            duration: fadeDuration,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rotateDeg = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${config.rotationDeg}deg`],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: config.x,
        top: -config.height,
        width: config.width,
        height: config.height,
        backgroundColor: config.color,
        borderRadius: config.borderRadius,
        opacity,
        transform: [{ translateY }, { translateX }, { rotate: rotateDeg }],
      }}
    />
  );
});

// Main ConfettiView – renders as a transparent full-screen Modal overlay
const ConfettiView = ({ visible, onAnimationEnd }) => {
  const particles = useMemo(
    () => Array.from({ length: NUM_PARTICLES }, (_, i) => buildParticleConfig(i)),
    // regenerate configs each time visible becomes true via key prop on parent
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      if (onAnimationEnd) onAnimationEnd();
    }, ANIMATION_DURATION_MS);
    return () => clearTimeout(timer);
  }, [visible, onAnimationEnd]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View style={styles.overlay} pointerEvents="none">
        {particles.map((cfg) => (
          <Particle key={cfg.id} config={cfg} />
        ))}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
});

export default ConfettiView;
