import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router, Stack } from "expo-router";
import { useAuth } from "../../../src/store/auth";
import { addStudent } from "../../../src/services/db";
import { PrimaryButton } from "../../../src/components/ui";
import { colors } from "../../../src/theme";

export default function AddStudentScreen() {
  const { user, institute } = useAuth();
  const batches = institute?.customBatches ?? [];
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [fee, setFee] = useState("");
  const [batchName, setBatchName] = useState(batches[0]?.name ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!user) return;
    const monthlyFee = Number(fee);
    if (!name.trim() || phone.replace(/\D/g, "").length < 10) {
      Alert.alert("Check details", "Name and a 10-digit phone are required.");
      return;
    }
    if (!Number.isFinite(monthlyFee) || monthlyFee < 0) {
      Alert.alert("Fee", "Enter a valid monthly fee.");
      return;
    }
    setSaving(true);
    try {
      const due = new Date();
      due.setMonth(due.getMonth() + 1);
      due.setHours(12, 0, 0, 0);
      await addStudent(user.uid, {
        name,
        parentPhone: phone,
        studentType: "batch",
        className: batches.find((b) => b.name === batchName)?.className || "N/A",
        batchName: batchName || "N/A",
        monthlyFee,
        nextDueDate: due,
      });
      router.back();
    } catch (error) {
      Alert.alert("Could not add", error instanceof Error ? error.message : "Try again");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.inner}>
      <Stack.Screen options={{ title: "Add student" }} />
      <Text style={styles.hint}>Same student list as the website. Due date starts next month — you can change it on web if needed.</Text>
      <Field label="Student name" value={name} onChangeText={setName} />
      <Field label="Parent WhatsApp" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Field label="Monthly fee" value={fee} onChangeText={setFee} keyboardType="numeric" />
      <Field label="Batch" value={batchName} onChangeText={setBatchName} />
      {batches.length > 0 && (
        <View style={styles.chips}>
          {batches.map((b) => (
            <Text
              key={b.id}
              onPress={() => {
                setBatchName(b.name);
                if (!fee) setFee(String(b.fee));
              }}
              style={[styles.chip, batchName === b.name && styles.chipOn]}
            >
              {b.name}
            </Text>
          ))}
        </View>
      )}
      <PrimaryButton title="Save student" loading={saving} onPress={() => void save()} />
    </ScrollView>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "numeric" | "phone-pad" | "default";
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        keyboardType={props.keyboardType}
        placeholderTextColor={colors.textDim}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  inner: { padding: 16, gap: 14, paddingBottom: 40 },
  hint: { color: colors.textMuted },
  label: { color: colors.textMuted, fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    color: colors.textMuted,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    overflow: "hidden",
  },
  chipOn: { color: colors.accent, borderColor: colors.accent },
});
