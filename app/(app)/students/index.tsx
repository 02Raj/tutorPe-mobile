import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Link, router, Stack } from "expo-router";
import { useAuth } from "../../../src/store/auth";
import { isStudentFeeOverdue } from "../../../src/lib/billing";
import { formatInr, getOutstandingFee } from "../../../src/lib/payments";
import { colors } from "../../../src/theme";
import { PrimaryButton } from "../../../src/components/ui";

export default function StudentsScreen() {
  const { students, institute } = useAuth();
  const [q, setQ] = useState("");
  const timing = institute?.feeCollectionTiming === "advance" ? "advance" : "arrear";

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    return students.filter((s) =>
      !query || s.name.toLowerCase().includes(query) || s.batchName.toLowerCase().includes(query)
    );
  }, [students, q]);

  return (
    <View style={styles.wrap}>
      <Stack.Screen options={{ title: "Students" }} />
      <View style={styles.head}>
        <TextInput
          placeholder="Search name or batch"
          placeholderTextColor={colors.textDim}
          value={q}
          onChangeText={setQ}
          style={styles.search}
        />
        <PrimaryButton title="Add student" onPress={() => router.push("/students/add")} />
      </View>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 40 }}
        ListEmptyComponent={<Text style={styles.empty}>No students yet. Add one — same as the website.</Text>}
        renderItem={({ item }) => {
          const due = isStudentFeeOverdue(item, timing);
          return (
            <Link href={`/students/${item.id}`} asChild>
              <Pressable style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.meta}>
                    {item.batchName} · {formatInr(getOutstandingFee(item))}
                  </Text>
                </View>
                <Text style={{ color: due ? colors.danger : colors.success, fontWeight: "700" }}>
                  {due ? "Due" : "OK"}
                </Text>
              </Pressable>
            </Link>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  head: { padding: 16, gap: 10 },
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 48,
  },
  empty: { color: colors.textMuted, textAlign: "center", marginTop: 24 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  name: { color: colors.text, fontSize: 16, fontWeight: "700" },
  meta: { color: colors.textMuted, marginTop: 4 },
});
