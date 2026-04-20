import { ReactNode } from 'react'
import { ScrollView, StyleSheet, Text, View, Platform } from 'react-native'
import LiquidGlassBackground, { glass } from './LiquidGlassBackground'
import AnimatedEntrance from './AnimatedEntrance'

interface ScreenScaffoldProps {
  eyebrow?: string
  title: string
  subtitle?: string
  headerAction?: ReactNode
  children: ReactNode
  scroll?: boolean
}

export default function ScreenScaffold({
  eyebrow,
  title,
  subtitle,
  headerAction,
  children,
  scroll = true,
}: ScreenScaffoldProps) {
  const content = (
    <AnimatedEntrance delay={20}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {headerAction}
      </View>
      {children}
    </AnimatedEntrance>
  )

  return (
    <LiquidGlassBackground>
      {scroll ? (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          {content}
        </ScrollView>
      ) : (
        <View style={[styles.container, styles.content]}>{content}</View>
      )}
    </LiquidGlassBackground>
  )
}

const webBlur = (amount: string): object =>
  Platform.OS === 'web'
    ? ({ backdropFilter: `blur(${amount}) saturate(180%)`, WebkitBackdropFilter: `blur(${amount}) saturate(180%)` } as object)
    : {}

export const shell = StyleSheet.create({
  card: {
    ...glass.card,
    padding: 16,
  } as any,
  softCard: {
    ...glass.softCard,
    padding: 14,
  } as any,
  primaryButton: {
    backgroundColor: '#2b5fd9',
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b72f5',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 10,
  },
  secondaryButton: {
    ...glass.pill,
    paddingVertical: 10,
    paddingHorizontal: 14,
  } as any,
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: 'rgba(240, 244, 255, 0.92)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    ...webBlur('16px'),
  } as any,
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 24,
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    color: 'rgba(160, 185, 230, 0.65)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: 'rgba(240, 244, 255, 0.95)',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: 'rgba(180, 200, 235, 0.60)',
    fontSize: 14,
    marginTop: 5,
    lineHeight: 20,
  },
})
