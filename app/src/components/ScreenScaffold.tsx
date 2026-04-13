import { ReactNode } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
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

export const shell = StyleSheet.create({
  card: {
    ...glass.card,
    padding: 16,
  },
  softCard: {
    ...glass.softCard,
    padding: 14,
  },
  primaryButton: {
    backgroundColor: '#0f4c81',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f4c81',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  secondaryButton: {
    ...glass.pill,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.62)',
    color: '#10213a',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.68)',
  },
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
    color: '#5d6f85',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#10213a',
  },
  subtitle: {
    color: '#4f6478',
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
})
