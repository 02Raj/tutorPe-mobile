import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../../src/store/auth";
import type { ClassSchedule } from "../../src/lib/types";
import {
  addSchedule,
  deleteSchedule,
  fetchSchedules,
} from "../../src/services/db";
import {
  DAY_LABELS,
  buildClassWhatsAppMessage,
  formatClassTimeLabel,
  isScheduleToday,
  studentsForClass,
} from "../../src/lib/class-reminders";
import { classWhatsAppUrl, openWhatsApp } from "../../src/lib/whatsapp";
import { Card, PrimaryButton } from "../../src/components/ui";
import { colors } from "../../src/theme";

export default function ScheduleScreen() {
  const { user, institute, students } = useAuth();
  const [rows, setRows] = useState<ClassSchedule[]>([]);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("16:00");
  const [endTime, setEndTime] = useState("17:00");
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [batchName, setBatchName] = useState("");
  const [saving, setSaving] = useState(false);
  const name = institute?.tuitionName || institute?.name || "TutorPe";

  const load = useCallback(async () => {
    if (!user) return;
    setRows(await fetchSchedules(user.uid));
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleDay = (d: number) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  };

  const save = async () => {
    if (!user || !title.trim() || days.length === 0) {
      Alert.alert("Schedule", "Title and at least one day are required.");
      return;
    }
    setSaving(true);
    try {
      await addSchedule(user.uid, {
        title: title.trim(),
        daysOfWeek: days,
        startTime,
        endTime,
        color: colors.accent,
        batchName: batchName.trim() || title.trim(),
      });
      setTitle("");
      await load();
    } catch (error) {
      Alert.alert("Could not save", error instanceof Error ? error.message : "Try again");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={styles.inner}>
      <Text style={styles.lead}>Today's classes and 1-tap WhatsApp — same schedule as the website.</Text>

      {rows.filter((row) => isScheduleToday(row)).map((row) => {
        const kids = studentsForClass(students, row);
        return (
          <Card key={row.id}>
            <Text style={styles.title}>{row.title}</Text>
            <Text style={styles.meta}>
              Today · {formatClassTimeLabel(row.startTime)} · {kids.length} students
            </Text>
            {kids.slice(0, 8).map((s) => (
              <PrimaryButton
                key={s.id}
                title={`WhatsApp ${s.name}`}
                tone="whatsapp"
                style={{ marginTop: 8 }}
                onPress={() =>
                  void openWhatsApp(
                    classWhatsAppUrl(
                      s.parentPhone,
                      buildClassWhatsAppMessage(s.name, name, row.title, row.startTime)
                    )
                  )
                }
              />
            ))}
          </Card>
        );
      })}

      <Text style={styles.section}>All classes</Text>
      {rows.map((row) => (
        <Card key={`all-${row.id}`}>
          <Text style={styles.title}>{row.title}</Text>
          <Text style={styles.meta}>
            {row.daysOfWeek.map((d) => DAY_LABELS[d]).join(" ")} · {formatClassTimeLabel(row.startTime)}
            {row.batchName ? ` · ${row.batchName}` : ""}
          </Text>
          <Text
            style={styles.delete}
            onPress={() =>
              Alert.alert("Delete class?", row.title, [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => void deleteSchedule(row.id).then(load),
                },
              ])
            }
          >
            Remove
          </Text>
        </Card>
      ))}

      <Text style={styles.section}>Add class</Text>
      <TextInput placeholder="Title" placeholderTextColor={colors.textDim} value={title} onChangeText={setTitle} style={styles.input} />
      <TextInput placeholder="Batch name (who to remind)" placeholderTextColor={colors.textDim} value={batchName} onChangeText={setBatchName} style={styles.input} />
      <TextInput placeholder="Start 16:00" placeholderTextColor={colors.textDim} value={startTime} onChangeText={setStartTime} style={styles.input} />
      <TextInput placeholder="End 17:00" placeholderTextColor={colors.textDim} value={endTime} onChangeText={setEndTime} style={styles.input} />
      <View style={styles.days}>
        {DAY_LABELS.map((label, i) => (
          <Text key={label} onPress={() => toggleDay(i)} style={[styles.day, days.includes(i) && styles.dayOn]}>
            {label}
          </Text>
        ))}
      </View>
      <PrimaryButton title="Save class" loading={saving} onPress={() => void save()} />
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
  delete: { color: colors.danger, marginTop: 8, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: 12,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  days: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  day: {
    color: colors.textMuted,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    overflow: "hidden",
  },
  dayOn: { color: colors.accent, borderColor: colors.accent },
});
