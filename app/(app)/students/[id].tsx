import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../../src/store/auth";
import { markAsPaid, recordReminderSent } from "../../../src/services/db";
import { formatInr, getOutstandingFee } from "../../../src/lib/payments";
import type { PaymentMethod } from "../../../src/lib/types";
import { feeReminderUrl, openWhatsApp } from "../../../src/lib/whatsapp";
import { PrimaryButton } from "../../../src/components/ui";
import { colors } from "../../../src/theme";

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { students, institute } = useAuth();
  const student = students.find((s) => s.id === id);
  const due = student ? getOutstandingFee(student) : 0;
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [saving, setSaving] = useState(false);
  const name = institute?.tuitionName || institute?.name || "TutorPe";

  if (!student) {
    return (
      <View style={styles.wrap}>
        <Stack.Screen options={{ title: "Student" }} />
        <Text style={{ color: colors.textMuted, padding: 16 }}>Student not found.</Text>
      </View>
    );
  }

  const pay = async (full: boolean) => {
    const paid = full ? due : Number(amount);
    setSaving(true);
    try {
      await markAsPaid(student, method, paid);
      Alert.alert("Marked paid", `${formatInr(paid)} saved. Same ledger as the website.`);
      setAmount("");
    } catch (error) {
      Alert.alert("Payment", error instanceof Error ? error.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.inner}>
      <Stack.Screen options={{ title: student.name }} />
      <Text style={styles.name}>{student.name}</Text>
      <Text style={styles.meta}>
        {student.batchName} · {student.parentPhone}
      </Text>
      <Text style={styles.due}>Due {formatInr(due)}</Text>

      <PrimaryButton
        title="WhatsApp reminder"
        tone="whatsapp"
        onPress={() => {
          void openWhatsApp(feeReminderUrl(student, name));
          void recordReminderSent(student.instituteId);
        }}
      />

      <Text style={styles.section}>Mark paid</Text>
      <View style={styles.methods}>
        {(["upi", "cash", "bank", "other"] as PaymentMethod[]).map((m) => (
          <Text
            key={m}
            onPress={() => setMethod(m)}
            style={[styles.chip, method === m && styles.chipOn]}
          >
            {m.toUpperCase()}
          </Text>
        ))}
      </View>
      <PrimaryButton title={`Mark full ${formatInr(due)}`} loading={saving} onPress={() => void pay(true)} />
      <TextInput
        placeholder="Partial amount"
        placeholderTextColor={colors.textDim}
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        style={styles.input}
      />
      <PrimaryButton
        title="Mark partial"
        tone="ghost"
        loading={saving}
        disabled={!amount}
        onPress={() => void pay(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  inner: { padding: 16, gap: 12, paddingBottom: 40 },
  name: { color: colors.text, fontSize: 24, fontWeight: "800" },
  meta: { color: colors.textMuted },
  due: { color: colors.accent, fontSize: 20, fontWeight: "700" },
  section: { color: colors.text, fontWeight: "700", marginTop: 8 },
  methods: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    color: colors.textMuted,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  chipOn: { color: colors.accent, borderColor: colors.accent },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: 14,
  },
});
