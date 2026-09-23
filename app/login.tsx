import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Redirect } from "expo-router";
import { colors } from "../src/theme";
import { PrimaryButton } from "../src/components/ui";
import { authErrorMessage, useAuth } from "../src/store/auth";

export default function LoginScreen() {
  const { user, ready, busy, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (ready && user) return <Redirect href="/dashboard" />;

  const submit = async () => {
    setError("");
    try {
      if (mode === "signup") {
        if (!name.trim()) throw new Error("Enter your name.");
        await signUp(name, email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(authErrorMessage(err));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrap}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.mark}>
          Tutor<Text style={{ color: colors.accent }}>Pe</Text>
        </Text>
        <Text style={styles.title}>{mode === "login" ? "Welcome back" : "Create account"}</Text>
        <Text style={styles.sub}>Same account as the website. Data stays in sync.</Text>

        {mode === "signup" && (
          <TextInput
            placeholder="Your name"
            placeholderTextColor={colors.textDim}
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
        )}
        <TextInput
          placeholder="Email"
          placeholderTextColor={colors.textDim}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor={colors.textDim}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton
          title={mode === "login" ? "Login" : "Sign up"}
          loading={busy}
          onPress={submit}
        />
        <Text
          style={styles.switch}
          onPress={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login" ? "New here? Sign up free" : "Already have an account? Login"}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  inner: { padding: 24, paddingTop: 80, gap: 12 },
  mark: { fontSize: 28, fontWeight: "800", color: colors.text },
  title: { fontSize: 24, fontWeight: "700", color: colors.text, marginTop: 12 },
  sub: { color: colors.textMuted, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 50,
    fontSize: 16,
  },
  error: { color: colors.danger },
  switch: { color: colors.accent, textAlign: "center", marginTop: 8, fontWeight: "600" },
});
