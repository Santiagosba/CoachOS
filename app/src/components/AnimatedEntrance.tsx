import { ReactNode, useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, ViewStyle } from 'react-native'

interface AnimatedEntranceProps {
  children: ReactNode
  delay?: number
  distance?: number
  style?: ViewStyle | ViewStyle[]
}

export default function AnimatedEntrance({
  children,
  delay = 0,
  distance = 18,
  style,
}: AnimatedEntranceProps) {
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(distance)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 520,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start()
  }, [delay, opacity, translateY])

  return (
    <Animated.View
      style={[
        styles.base,
        style,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
  },
})
