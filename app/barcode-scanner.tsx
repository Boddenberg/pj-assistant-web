// ─── Barcode Scanner Screen ───────────────────────────────────────────
// Camera-based barcode scanner — placeholder until expo-camera is added.

import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, radius, fontSize, fontWeight } from '@/theme'

export default function BarcodeScannerScreen() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      {/* Camera viewfinder placeholder */}
      <View style={styles.viewfinder}>
        <View style={styles.scanArea}>
          {/* Corner markers */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          <Ionicons name="scan-outline" size={64} color={colors.itauOrange} />
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.infoTitle}>Aponte para o código de barras</Text>
        <Text style={styles.infoSubtitle}>
          Posicione o código de barras do boleto dentro da área de leitura
        </Text>

        <View style={styles.tipRow}>
          <View style={styles.tipCard}>
            <Ionicons name="sunny-outline" size={20} color={colors.itauOrange} />
            <Text style={styles.tipText}>Boa iluminação</Text>
          </View>
          <View style={styles.tipCard}>
            <Ionicons name="resize-outline" size={20} color={colors.itauOrange} />
            <Text style={styles.tipText}>Código inteiro visível</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.manualButton} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="keypad-outline" size={18} color={colors.itauOrange} />
          <Text style={styles.manualText}>Digitar código manualmente</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  viewfinder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scanArea: {
    width: 280, height: 160,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  corner: {
    position: 'absolute', width: 24, height: 24,
    borderColor: colors.itauOrange, borderWidth: 3,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  info: {
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
    padding: spacing['2xl'],
    gap: spacing.xl,
  },
  infoTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.textPrimary, textAlign: 'center' },
  infoSubtitle: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  tipRow: { flexDirection: 'row', gap: spacing.md },
  tipCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.itauOrangeSoft, borderRadius: radius.lg,
    padding: spacing.lg,
  },
  tipText: { fontSize: fontSize.xs, fontWeight: fontWeight.medium, color: colors.textPrimary },
  manualButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  manualText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.itauOrange },
})
