import { ReactNode } from 'react'
import { View, StyleSheet } from 'react-native'

export default function LiquidGlassBackground({ children }: { children: ReactNode }) {
  return (
    <View style={styles.screen}>
      <View style={[styles.orb, styles.orbA]} />
      <View style={[styles.orb, styles.orbB]} />
      <View style={[styles.orb, styles.orbC]} />
      <View style={styles.veil} />
      {children}
    </View>
  )
}

export const glass = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.46)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.58)',
    borderRadius: 24,
    shadowColor: '#081526',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
  },
  softCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.34)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.42)',
    borderRadius: 20,
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.48)',
    borderRadius: 999,
  },
})

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#9bc2e6',
  },
  veil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248, 251, 255, 0.8)',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbA: {
    width: 260,
    height: 260,
    top: -60,
    right: -30,
    backgroundColor: 'rgba(255,255,255,0.62)',
  },
  orbB: {
    width: 220,
    height: 220,
    top: 180,
    left: -70,
    backgroundColor: 'rgba(162, 220, 232, 0.55)',
  },
  orbC: {
    width: 300,
    height: 300,
    bottom: -110,
    right: -60,
    backgroundColor: 'rgba(191, 214, 255, 0.42)',
  },
})
