import { useMemo } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../src/store/auth";
import { isStudentFeeOverdue } from "../../src/lib/billing";
import { formatInr, getOutstandingFee } from "../../src/lib/payments";
import { feeReminderUrl, openWhatsApp } from "../../src/lib/whatsapp";
import { recordReminderSent } from "../../src/services/db";
import { Card, PrimaryButton } from "../../src/components/ui";
import { colors } from "../../src/theme";

export default function RemindersScreen() {
  const { students, institute } = useAuth();
  const name = institute?.tuitionName || institute?.name || "TutorPe";
  const timing = institute?.feeCollectionTiming === "advance" ? "advance" : "arrear";
  const overdue = useMemo(
    () => students.filter((s) => isStudentFeeOverdue(s, timing)),
    [students, timing]
  );

  return (
    <View style={styles.wrap}>
      <FlatList
        data={overdue}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}
        ListHeaderComponent={
          <Text style={styles.lead}>
            {overdue.length} pending. Opens WhatsApp on this phone — TutorPe does not send for you.
          </Text>
        }
        ListEmptyComponent={
          <Card>
            <Text style={{ color: colors.textMuted }}>Nobody is due. You're clear.</Text>
          </Card>
        }
        renderItem={({ item }) => (
          <Card>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>
              {item.batchName} · {formatInr(getOutstandingFee(item))}
            </Text>
            <PrimaryButton
              title="WhatsApp"
              tone="whatsapp"
              style={{ marginTop: 12 }}
              onPress={() => {
                void openWhatsApp(feeReminderUrl(item, name)).catch((e) =>
                  Alert.alert("WhatsApp", String(e))
                );
                void recordReminderSent(item.instituteId);
              }}
            />
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  lead: { color: colors.textMuted, marginBottom: 8 },
  name: { color: colors.text, fontSize: 16, fontWeight: "700" },
  meta: { color: colors.textMuted, marginTop: 4 },
});
