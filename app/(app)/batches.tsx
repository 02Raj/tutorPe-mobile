import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../../src/store/auth";
import { addCustomBatch } from "../../src/services/db";
import { Card, PrimaryButton } from "../../src/components/ui";
import { colors } from "../../src/theme";
import { formatInr } from "../../src/lib/payments";

export default function BatchesScreen() {
  const { user, institute } = useAuth();
  const batches = institute?.customBatches ?? [];
  const [name, setName] = useState("");
  const [className, setClassName] = useState("");
  const [fee, setFee] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!user) return;
    const amount = Number(fee);
    if (!name.trim() || !className.trim() || !Number.isFinite(amount)) {
      Alert.alert("Batch", "Name, class, and fee are required.");
      return;
    }
    setSaving(true);
    try {
      await addCustomBatch(user.uid, {
        id: `${Date.now()}`,
        name: name.trim(),
        className: className.trim(),
        fee: amount,
      });
      setName("");
      setClassName("");
      setFee("");
    } catch (error) {
      Alert.alert("Could not save", error instanceof Error ? error.message : "Try again");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.inner}>
      <Text style={styles.lead}>Batches stay on the same institute as the website.</Text>
      {batches.length === 0 ? (
        <Card>
          <Text style={{ color: colors.textMuted }}>No batches yet. Add one, then pick it when you add a student.</Text>
        </Card>
      ) : (
        batches.map((b) => (
          <Card key={b.id}>
            <Text style={styles.title}>{b.name}</Text>
            <Text style={styles.meta}>
              {b.className} · {formatInr(b.fee)}
            </Text>
          </Card>
        ))
      )}
      <Text style={styles.section}>New batch</Text>
      <TextInput placeholder="Batch name" placeholderTextColor={colors.textDim} value={name} onChangeText={setName} style={styles.input} />
      <TextInput placeholder="Class / group" placeholderTextColor={colors.textDim} value={className} onChangeText={setClassName} style={styles.input} />
      <TextInput placeholder="Default fee" placeholderTextColor={colors.textDim} keyboardType="numeric" value={fee} onChangeText={setFee} style={styles.input} />
      <PrimaryButton title="Save batch" loading={saving} onPress={() => void save()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  inner: { padding: 16, gap: 12, paddingBottom: 40 },
  lead: { color: colors.textMuted },
  section: { color: colors.text, fontWeight: "700", marginTop: 8 },
  title: { color: colors.text, fontSize: 16, fontWeight: "700" },
  meta: { color: colors.textMuted, marginTop: 4 },
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
