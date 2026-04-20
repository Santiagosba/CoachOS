import { ReactNode } from 'react'
import { View, StyleSheet, Platform } from 'react-native'

export default function LiquidGlassBackground({ children }: { children: ReactNode }) {
  return (
    <View style={styles.screen}>
      <View style={[styles.orb, styles.orbA]} />
      <View style={[styles.orb, styles.orbB]} />
      <View style={[styles.orb, styles.orbC]} />
      <View style={[styles.orb, styles.orbD]} />
      {children}
    </View>
  )
}

// Web-only backdrop blur helper — ignored on native
const webBlur = (amount: string): object =>
  Platform.OS === 'web'
    ? ({
        backdropFilter: `blur(${amount}) saturate(180%)`,
        WebkitBackdropFilter: `blur(${amount}) saturate(180%)`,
      } as object)
    : {}

export const glass = {
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.50,
    shadowRadius: 40,
    elevation: 20,
    ...webBlur('28px'),
  },
  softCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 22,
    ...webBlur('16px'),
  },
  pill: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    borderRadius: 999,
    ...webBlur('12px'),
  },
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#060d1b',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbA: {
    width: 420,
    height: 420,
    top: -140,
    right: -100,
    backgroundColor: 'rgba(45, 115, 255, 0.32)',
  },
  orbB: {
    width: 320,
    height: 320,
    top: 220,
    left: -120,
    backgroundColor: 'rgba(140, 55, 235, 0.24)',
  },
  orbC: {
    width: 380,
    height: 380,
    bottom: -130,
    right: -80,
    backgroundColor: 'rgba(0, 200, 175, 0.18)',
  },
  orbD: {
    width: 240,
    height: 240,
    bottom: 180,
    left: 60,
    backgroundColor: 'rgba(70, 60, 220, 0.14)',
  },
})
