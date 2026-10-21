import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../../api/api";

const PURPLE = "#7c3aed";

interface Store {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  whatsAppNumber?: string;
  instagramHandle?: string;
  currency: string;
  stats?: {
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
  };
}

export default function StoreScreen() {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState({
    name: "",
    description: "",
    whatsAppNumber: "",
    instagramHandle: "",
    supportEmail: "",
    currency: "NGN",
  });

  useEffect(() => {
    fetchStore();
  }, []);

  const fetchStore = async () => {
    try {
      const res = await api.get("/stores/my-store");
      const s = res.data.data;
      setStore(s);
      setForm({
        name: s.name ?? "",
        description: s.description ?? "",
        whatsAppNumber: s.whatsAppNumber ?? "",
        instagramHandle: s.instagramHandle ?? "",
        supportEmail: s.supportEmail ?? "",
        currency: s.currency ?? "NGN",
      });
    } catch {
      Alert.alert("Error", "Failed to load store");
    } finally {
      setLoading(false);
    }
  };

  const saveStore = async () => {
    setSaving(true);
    try {
      await api.put("/stores", form);
      Alert.alert("✅ Saved", "Store updated successfully!");
      fetchStore();
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploadingLogo(true);
      try {
        const formData = new FormData();
        formData.append("file", {
          uri: result.assets[0].uri,
          type: "image/jpeg",
          name: "logo.jpg",
        } as any);

        await api.post("/upload/store/logo", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        Alert.alert("✅", "Logo updated!");
        fetchStore();
      } catch {
        Alert.alert("Error", "Failed to upload logo");
      } finally {
        setUploadingLogo(false);
      }
    }
  };

  const viewStore = () => {
    if (store?.slug) {
      Linking.openURL(
        `https://vendify-frontend-mocha.vercel.app/store/${store.slug}`,
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={PURPLE} size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Store Card */}
      {store && (
        <View style={[styles.storeCard, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity
            style={styles.logoContainer}
            onPress={uploadLogo}
            disabled={uploadingLogo}
          >
            {uploadingLogo ? (
              <ActivityIndicator color={PURPLE} />
            ) : store.logoUrl ? (
              <Image source={{ uri: store.logoUrl }} style={styles.logoImage} />
            ) : (
              <Text style={styles.logoEmoji}>🏪</Text>
            )}
            <View style={styles.editLogoBtn}>
              <Text style={styles.editLogoText}>📷</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.storeInfo}>
            <Text style={styles.storeName}>{store.name}</Text>
            <Text style={styles.storeSlug}>vendify.com/{store.slug}</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {store.stats?.totalProducts ?? 0}
              </Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {store.stats?.totalOrders ?? 0}
              </Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                ₦{(store.stats?.totalRevenue ?? 0).toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Revenue</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.viewStoreBtn} onPress={viewStore}>
            <Text style={styles.viewStoreBtnText}>🌐 View My Store</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Edit Form */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Store Information</Text>

        <Field
          label="Store Name"
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
          placeholder="Your store name"
        />
        <Field
          label="Description"
          value={form.description}
          onChange={(v) => setForm({ ...form, description: v })}
          placeholder="Tell customers what you sell..."
          multiline
        />
        <Field
          label="Support Email"
          value={form.supportEmail}
          onChange={(v) => setForm({ ...form, supportEmail: v })}
          placeholder="support@yourstore.com"
          keyboardType="email-address"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contact & Social</Text>

        <Field
          label="📱 WhatsApp Number"
          value={form.whatsAppNumber}
          onChange={(v) => setForm({ ...form, whatsAppNumber: v })}
          placeholder="08012345678"
          keyboardType="phone-pad"
        />
        <Field
          label="📸 Instagram Handle"
          value={form.instagramHandle}
          onChange={(v) => setForm({ ...form, instagramHandle: v })}
          placeholder="yourstorehandle"
          prefix="@"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Currency</Text>
        <View style={styles.currencyGrid}>
          {[
            { code: "NGN", flag: "🇳🇬", label: "Naira" },
            { code: "USD", flag: "🇺🇸", label: "Dollar" },
            { code: "GBP", flag: "🇬🇧", label: "Pound" },
            { code: "EUR", flag: "🇪🇺", label: "Euro" },
            { code: "GHS", flag: "🇬🇭", label: "Cedis" },
          ].map((c) => (
            <TouchableOpacity
              key={c.code}
              style={[
                styles.currencyBtn,
                form.currency === c.code && styles.currencyBtnActive,
              ]}
              onPress={() => setForm({ ...form, currency: c.code })}
            >
              <Text style={styles.currencyFlag}>{c.flag}</Text>
              <Text
                style={[
                  styles.currencyCode,
                  form.currency === c.code && {
                    color: PURPLE,
                  },
                ]}
              >
                {c.code}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={saveStore}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.saveBtnText}>💾 Save Changes</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// Reusable Field Component
const Field = ({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  keyboardType,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: any;
  prefix?: string;
}) => (
  <View style={fieldStyles.container}>
    <Text style={fieldStyles.label}>{label}</Text>
    <View style={fieldStyles.inputRow}>
      {prefix && <Text style={fieldStyles.prefix}>{prefix}</Text>}
      <TextInput
        style={[
          fieldStyles.input,
          multiline && fieldStyles.textarea,
          prefix ? { paddingLeft: 4 } : undefined,
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  </View>
);

const fieldStyles = StyleSheet.create({
  container: { marginBottom: 14 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    backgroundColor: "#fafafa",
    paddingHorizontal: 12,
  },
  prefix: {
    fontSize: 15,
    color: "#9ca3af",
    marginRight: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
  },
  textarea: {
    height: 80,
    textAlignVertical: "top",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  storeCard: {
    backgroundColor: PURPLE,
    padding: 20,
    alignItems: "center",
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    overflow: "hidden",
    position: "relative",
  },
  logoImage: {
    width: 80,
    height: 80,
    resizeMode: "cover",
  },
  logoEmoji: {
    fontSize: 36,
  },
  editLogoBtn: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    paddingVertical: 2,
  },
  editLogoText: {
    fontSize: 14,
  },
  storeInfo: {
    alignItems: "center",
    marginBottom: 16,
  },
  storeName: {
    fontSize: 22,
    fontWeight: "800",
    color: "white",
    marginBottom: 4,
  },
  storeSlug: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    width: "100%",
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "white",
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  viewStoreBtn: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  viewStoreBtnText: {
    color: PURPLE,
    fontWeight: "700",
    fontSize: 14,
  },
  card: {
    backgroundColor: "white",
    margin: 12,
    marginBottom: 0,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 14,
  },
  currencyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  currencyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    borderWidth: 2,
    borderColor: "transparent",
  },
  currencyBtnActive: {
    borderColor: PURPLE,
    backgroundColor: "#f5f3ff",
  },
  currencyFlag: {
    fontSize: 16,
  },
  currencyCode: {
    fontWeight: "700",
    color: "#374151",
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: PURPLE,
    margin: 12,
    marginTop: 16,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
});
