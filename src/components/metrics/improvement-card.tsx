// ─── Improvement Card ────────────────────────────────────────────────
// Shows top improvement suggestions from LLM Judge.

import React, { useState } from 'react'
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Card } from '@/components/ui'
import { colors, spacing, radius, fontSize, fontWeight } from '@/theme'

interface ImprovementCardProps {
  suggestion: string
  count: number
}

  const [modalVisible, setModalVisible] = useState(false)
  return (
    <>
      <Pressable onPress={() => setModalVisible(true)}>
        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={styles.iconWrap}>
              <Ionicons name="bulb-outline" size={16} color={colors.warning} />
            </View>
            <View style={styles.textCol}>
              <Text style={styles.suggestion} numberOfLines={2} ellipsizeMode="tail">{suggestion}</Text>
              <Text style={styles.count}>{count}× mencionado</Text>
            </View>
          </View>
        </Card>
      </Pressable>
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Melhoria sugerida</Text>
            <Text style={styles.modalSuggestion}>{suggestion}</Text>
            <Text style={styles.modalCount}>{count}× mencionado</Text>
            <Pressable style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseText}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  textCol: {
    flex: 1,
  },
  suggestion: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
    lineHeight: 18,
  },
  count: {
    fontSize: fontSize['2xs'],
    color: colors.textMuted,
    marginTop: spacing['2xs'],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: colors.bgPrimary,
    borderRadius: radius.lg,
    padding: spacing['2xl'],
    minWidth: 280,
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  modalSuggestion: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  modalCount: {
    fontSize: fontSize['2xs'],
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  modalCloseBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing['2xs'],
    paddingHorizontal: spacing.lg,
  },
  modalCloseText: {
    color: colors.textInverse,
    fontWeight: fontWeight.medium,
    fontSize: fontSize.sm,
  },
})
