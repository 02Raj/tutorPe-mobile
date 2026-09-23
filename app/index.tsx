import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { colors } from "../src/theme";
import { useAuth } from "../src/store/auth";

export default function Index() {
  const { ready, user } = useAuth();
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }
  return <Redirect href={user ? "/dashboard" : "/login"} />;
}
