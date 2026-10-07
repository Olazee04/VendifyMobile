import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert
} from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function RegisterScreen({ navigation }: any) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phoneNumber: "",
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!form.firstName || !form.lastName ||
        !form.email || !form.password) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }
    if (form.password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      const result = await register(form);
      Alert.alert(
        "Success!",
        result.message || "Account created! Please log in.",
        [{ text: "Go to Login", onPress: () => navigation.navigate("Login") }]
      );
    } catch (error: any) {
      const msg = error.response?.data?.message
        || "Registration failed. Please try again.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.inner}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>
          Start selling on Vendify today
        </Text>

        <TextInput
          style={styles.input}
          placeholder="First Name"
          value={form.firstName}
          onChangeText={(v) => setForm({ ...form, firstName: v })}
        />
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          value={form.lastName}
          onChangeText={(v) => setForm({ ...form, lastName: v })}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={form.email}
          onChangeText={(v) => setForm({ ...form, email: v })}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password (min 8 characters)"
          value={form.password}
          onChangeText={(v) => setForm({ ...form, password: v })}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="Phone Number (optional)"
          value={form.phoneNumber}
          onChangeText={(v) => setForm({ ...form, phoneNumber: v })}
          keyboardType="phone-pad"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Create Account</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Login")}
          style={styles.loginLink}>
          <Text style={styles.loginText}>
            Already have an account?{" "}
            <Text style={styles.loginTextBold}>Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  inner: { padding: 24, paddingTop: 60 },
  title: {
    fontSize: 28, fontWeight: "800",
    color: "#111827", marginBottom: 8
  },
  subtitle: {
    fontSize: 15, color: "#6b7280", marginBottom: 32
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1, borderColor: "#e5e7eb",
    borderRadius: 12, padding: 14,
    fontSize: 15, marginBottom: 12, color: "#111827"
  },
  button: {
    backgroundColor: "#7c3aed",
    borderRadius: 12, padding: 16,
    alignItems: "center", marginTop: 8
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: "#fff", fontSize: 16, fontWeight: "700"
  },
  loginLink: { marginTop: 20, alignItems: "center" },
  loginText: { fontSize: 14, color: "#6b7280" },
  loginTextBold: { color: "#7c3aed", fontWeight: "700" },
});
