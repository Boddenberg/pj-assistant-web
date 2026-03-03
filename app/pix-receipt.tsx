// ─── Pix Receipt Screen ──────────────────────────────────────────────
// Beautiful receipt / comprovante after a Pix transfer.
// Supports image-based sharing via react-native-view-shot + expo-sharing.

import React, { useEffect, useState, useRef } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Share, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import * as Sharing from 'expo-sharing'
import ViewShot from 'react-native-view-shot'

import { ActionButton, Card } from '@/components/ui'
import { httpClient, formatCurrency } from '@/lib'
import { colors, spacing, radius, fontSize, fontWeight, shadow } from '@/theme'

interface PixReceipt {
  id: string
  transferId: string
  direction: string
  amount: number
  description?: string
  e2eId: string
  fundedBy: string
  installments: number
  sender: { name: string; document: string; bank: string; branch: string; account: string }
  recipient: { name: string; document: string; bank: string; branch: string; account: string }
  pixKey?: { type: string; value: string }
  status: string
  executedAt: string
  createdAt: string
}

export default function PixReceiptScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ transferId?: string; receiptId?: string }>()
  const [receipt, setReceipt] = useState<PixReceipt | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const viewShotRef = useRef<ViewShot>(null)

  useEffect(() => {
    ;(async () => {
      try {
        let data: PixReceipt
        if (params.receiptId) {
          const res = await httpClient.get<PixReceipt>(`/v1/pix/receipts/${params.receiptId}`)
          data = res.data
        } else if (params.transferId) {
          const res = await httpClient.get<PixReceipt>(`/v1/pix/transfers/${params.transferId}/receipt`)
          data = res.data
        } else {
          throw new Error('ID do comprovante não informado.')
        }
        setReceipt(data)
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      } catch {
        setError('Não foi possível carregar o comprovante.')
      } finally {
        setLoading(false)
      }
    })()
  }, [params.receiptId, params.transferId])

  const handleShare = async () => {
    if (!receipt) return
    try {
      // Capture the visual receipt as an image via ViewShot
      if (viewShotRef.current?.capture) {
        const uri = await viewShotRef.current.capture()
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Compartilhar comprovante Pix',
            UTI: 'public.png',
          })
          return
        }
      }
    } catch {
      // Fallback to text sharing below
    }
    // Fallback: text-based share (web or if capture fails)
    const text = [
      '══════════════════════',
      '   COMPROVANTE PIX',
      '══════════════════════',
      '',
      `Valor: ${formatCurrency(receipt.amount)}`,
      `Para: ${receipt.recipient.name}`,
      `De: ${receipt.sender.name}`,
      receipt.description ? `Descrição: ${receipt.description}` : '',
      `Data: ${new Date(receipt.executedAt).toLocaleString('pt-BR')}`,
      `ID: ${receipt.e2eId}`,
      receipt.fundedBy === 'credit_card' ? `Parcelas: ${receipt.installments}x` : '',
      '',
      'Itaú Empresas PJ',
    ].filter(Boolean).join('\n')

    await Share.share({ message: text, title: 'Comprovante Pix' })
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const maskDoc = (doc: string) => {
    const digits = doc.replace(/\D/g, '')
    if (digits.length <= 11) return `***.***.${digits.slice(6, 9)}-**`
    return `**.***.***/****-${digits.slice(12, 14)}`
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.itauOrange} />
        <Text style={styles.loadingText}>Carregando comprovante...</Text>
      </View>
    )
  }

  if (error || !receipt) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle" size={48} color={colors.error} />
        <Text style={styles.errorTitle}>{error ?? 'Comprovante não encontrado'}</Text>
        <ActionButton title="Voltar" onPress={() => router.back()} variant="secondary" />
      </View>
    )
  }

  const isCreditCard = receipt.fundedBy === 'credit_card'

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
       <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }} style={styles.captureWrap}>
        {/* Header with success icon */}
        <View style={styles.header}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark-sharp" size={36} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>Pix enviado!</Text>
          <Text style={styles.headerAmount}>{formatCurrency(receipt.amount)}</Text>
          {isCreditCard && receipt.installments > 1 && (
            <Text style={styles.headerInstallments}>
              {receipt.installments}x no cartão de crédito
            </Text>
          )}
          <Text style={styles.headerDate}>{formatDate(receipt.executedAt)} às {formatTime(receipt.executedAt)}</Text>
        </View>

        {/* Status badge */}
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, receipt.status === 'completed' ? styles.statusCompleted : styles.statusPending]}>
            <Ionicons
              name={receipt.status === 'completed' ? 'checkmark-circle' : 'time'}
              size={14}
              color={receipt.status === 'completed' ? colors.success : colors.itauOrange}
            />
            <Text style={[styles.statusText, { color: receipt.status === 'completed' ? colors.success : colors.itauOrange }]}>
              {receipt.status === 'completed' ? 'Concluído' : 'Processando'}
            </Text>
          </View>
          {isCreditCard && (
            <View style={[styles.statusBadge, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="card" size={14} color="#7C3AED" />
              <Text style={[styles.statusText, { color: '#7C3AED' }]}>Cartão de crédito</Text>
            </View>
          )}
        </View>

        {/* Recipient card */}
        <Card style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Destinatário</Text>
          <View style={styles.personRow}>
            <View style={styles.personAvatar}>
              <Ionicons name="person" size={20} color={colors.itauOrange} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.personName}>{receipt.recipient.name}</Text>
              <Text style={styles.personDoc}>{maskDoc(receipt.recipient.document)}</Text>
            </View>
          </View>
          <DetailLine label="Banco" value={receipt.recipient.bank} />
          <DetailLine label="Agência" value={receipt.recipient.branch} />
          <DetailLine label="Conta" value={receipt.recipient.account} />
          {receipt.pixKey && (
            <DetailLine
              label={`Chave (${receipt.pixKey.type.toUpperCase()})`}
              value={receipt.pixKey.value}
            />
          )}
        </Card>

        {/* Sender card */}
        <Card style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Pagador</Text>
          <View style={styles.personRow}>
            <View style={[styles.personAvatar, { backgroundColor: colors.infoLight }]}>
              <Ionicons name="business" size={20} color={colors.itauBlue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.personName}>{receipt.sender.name}</Text>
              <Text style={styles.personDoc}>{maskDoc(receipt.sender.document)}</Text>
            </View>
          </View>
          <DetailLine label="Banco" value={receipt.sender.bank} />
          <DetailLine label="Agência" value={receipt.sender.branch} />
          <DetailLine label="Conta" value={receipt.sender.account} />
        </Card>

        {/* Transaction details */}
        <Card style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Detalhes da transação</Text>
          <DetailLine label="Valor" value={formatCurrency(receipt.amount)} bold />
          {receipt.description && <DetailLine label="Descrição" value={receipt.description} />}
          <DetailLine label="Tipo" value={isCreditCard ? 'Pix no Crédito' : 'Pix (Saldo)'} />
          {isCreditCard && receipt.installments > 1 && (
            <DetailLine label="Parcelas" value={`${receipt.installments}x no cartão — detalhes na fatura`} />
          )}
          <DetailLine label="ID E2E" value={receipt.e2eId} mono />
          <DetailLine label="ID Transação" value={receipt.transferId} mono />
        </Card>

        {/* Branding footer for shared image */}
        <View style={styles.brandFooter}>
          <View style={styles.brandDot} />
          <Text style={styles.brandText}>Itaú Empresas PJ</Text>
        </View>
       </ViewShot>

        {/* Action buttons (outside capture area) */}
        <View style={styles.actions}>
          <ActionButton
            title="Compartilhar comprovante"
            onPress={handleShare}
          />
          <ActionButton
            title="Voltar ao início"
            onPress={() => router.replace('/')}
            variant="secondary"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function DetailLine({ label, value, bold, mono }: { label: string; value: string; bold?: boolean; mono?: boolean }) {
  return (
    <View style={dlStyles.row}>
      <Text style={dlStyles.label}>{label}</Text>
      <Text
        style={[dlStyles.value, bold && dlStyles.bold, mono && dlStyles.mono]}
        numberOfLines={1}
        selectable
      >
        {value}
      </Text>
    </View>
  )
}

const dlStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  label: { fontSize: fontSize.sm, color: colors.textMuted, flex: 1 },
  value: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.textPrimary, textAlign: 'right', flex: 1.5 },
  bold: { fontWeight: fontWeight.bold, color: colors.itauOrange, fontSize: fontSize.md },
  mono: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 10, color: colors.textMuted },
})

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgPrimary },
  content: { padding: spacing.xl, gap: spacing.xl, paddingBottom: spacing['4xl'] },
  captureWrap: { backgroundColor: colors.bgPrimary, gap: spacing.xl, paddingBottom: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.xl, padding: spacing['2xl'] },
  loadingText: { fontSize: fontSize.sm, color: colors.textMuted },
  errorTitle: { fontSize: fontSize.md, color: colors.textPrimary, textAlign: 'center' },

  // Header
  header: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  successCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.success,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadow.md,
  },
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.textPrimary },
  headerAmount: { fontSize: 32, fontWeight: fontWeight.bold, color: colors.itauOrange, letterSpacing: -0.5 },
  headerInstallments: { fontSize: fontSize.sm, color: colors.textSecondary },
  headerDate: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },

  // Status
  statusRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  statusCompleted: { backgroundColor: colors.successLight },
  statusPending: { backgroundColor: colors.itauOrangeSoft },
  statusText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },

  // Cards
  detailCard: { gap: spacing.xs, padding: spacing.xl },
  sectionTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.itauBlue, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.sm },
  personAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.itauOrangeSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  personName: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textPrimary },
  personDoc: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },

  // Brand footer (inside captured image)
  brandFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingTop: spacing.lg },
  brandDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.itauOrange },
  brandText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.textMuted },

  // Actions
  actions: { gap: spacing.md, marginTop: spacing.md },
})
