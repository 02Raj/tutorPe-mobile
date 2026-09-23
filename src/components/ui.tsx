import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
} from "react-native";
import { colors } from "../theme";

export function PrimaryButton({
  title,
  loading,
  tone = "accent",
  ...props
}: PressableProps & { title: string; loading?: boolean; tone?: "accent" | "whatsapp" | "danger" | "ghost" }) {
  const bg =
    tone === "whatsapp"
      ? colors.whatsapp
      : tone === "danger"
        ? colors.danger
        : tone === "ghost"
          ? "transparent"
          : colors.accent;
  const fg = tone === "ghost" ? colors.text : colors.accentText;
  return (
    <Pressable
      {...props}
      disabled={props.disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, borderColor: tone === "ghost" ? colors.borderStrong : "transparent", opacity: pressed || props.disabled ? 0.75 : 1 },
        props.style as object,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.label, { color: fg }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  label: { fontSize: 16, fontWeight: "700" },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
});
