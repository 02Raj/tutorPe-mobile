import { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../src/store/auth";
import { isStudentFeeOverdue } from "../../src/lib/billing";
import { formatInr, getOutstandingFee } from "../../src/lib/payments";
import { feeReminderUrl, openWhatsApp } from "../../src/lib/whatsapp";
import { Card, PrimaryButton } from "../../src/components/ui";
import { colors } from "../../src/theme";
import { recordReminderSent } from "../../src/services/db";

export default function DashboardScreen() {
  const { institute, students, signOut } = useAuth();
  const [busyId, setBusyId] = useState<string | null>(null);
  const timing = institute?.feeCollectionTiming === "advance" ? "advance" : "arrear";
  const name = institute?.tuitionName || institute?.name || "TutorPe";

  const overdue = useMemo(
    () => students.filter((s) => isStudentFeeOverdue(s, timing)),
    [students, timing]
  );

  const remind = async (id: string) => {
    const student = students.find((s) => s.id === id);
    if (!student) return;
    setBusyId(id);
    try {
      await openWhatsApp(feeReminderUrl(student, name));
      await recordReminderSent(student.instituteId);
    } catch (error) {
      Alert.alert("WhatsApp", error instanceof Error ? error.message : "Could not open WhatsApp");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.inner}>
      <View style={styles.top}>
        <View>
          <Text style={styles.kicker}>Dashboard</Text>
          <Text style={styles.title}>{name}</Text>
        </View>
        <Text style={styles.logout} onPress={() => void signOut()}>
          Logout
        </Text>
      </View>

      <View style={styles.stats}>
        <Card>
          <Text style={styles.statLabel}>Students</Text>
          <Text style={styles.statValue}>{students.length}</Text>
        </Card>
        <Card>
          <Text style={[styles.statLabel, { color: colors.danger }]}>Fees due</Text>
          <Text style={[styles.statValue, { color: colors.danger }]}>{overdue.length}</Text>
        </Card>
      </View>

      <Text style={styles.section}>Due now — tap WhatsApp from your number</Text>
      {overdue.length === 0 ? (
        <Card>
          <Text style={styles.empty}>No pending fees. Nice.</Text>
        </Card>
      ) : (
        overdue.slice(0, 12).map((s) => (
          <Card key={s.id}>
            <Text style={styles.student}>{s.name}</Text>
            <Text style={styles.meta}>
              {s.batchName} · {formatInr(getOutstandingFee(s))}
            </Text>
            <PrimaryButton
              title="WhatsApp"
              tone="whatsapp"
              loading={busyId === s.id}
              onPress={() => void remind(s.id)}
              style={{ marginTop: 12 }}
            />
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  inner: { padding: 16, gap: 12, paddingBottom: 32 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  kicker: { color: colors.textMuted, fontSize: 12, textTransform: "uppercase" },
  title: { color: colors.text, fontSize: 22, fontWeight: "800" },
  logout: { color: colors.accent, fontWeight: "600" },
  stats: { flexDirection: "row", gap: 12 },
  statLabel: { color: colors.textMuted, fontSize: 12 },
  statValue: { color: colors.text, fontSize: 28, fontWeight: "800" },
  section: { color: colors.textMuted, marginTop: 8, fontWeight: "600" },
  empty: { color: colors.textMuted },
  student: { color: colors.text, fontSize: 17, fontWeight: "700" },
  meta: { color: colors.textMuted, marginTop: 4 },
});
