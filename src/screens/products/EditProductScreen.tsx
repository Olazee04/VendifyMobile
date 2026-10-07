import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  Alert, Switch, Image
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import api from "../../api/api";

export default function EditProductScreen({ route, navigation }: any) {
  const { productId } = route.params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    compareAtPrice: "",
    stockQuantity: "",
    sku: "",
    isPublished: false,
    trackInventory: true,
  });

  useEffect(() => { fetchProduct(); }, []);

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/products/${productId}`);
      const p = res.data.data;
      setForm({
        name: p.name ?? "",
        description: p.description ?? "",
        price: String(p.price ?? ""),
        compareAtPrice: String(p.compareAtPrice ?? ""),
        stockQuantity: String(p.stockQuantity ?? ""),
        sku: p.sku ?? "",
        isPublished: p.isPublished ?? false,
        trackInventory: p.trackInventory ?? true,
      });
      setImages(p.images?.map((img: any) => img.url) ?? []);
    } catch {
      Alert.alert("Error", "Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const uris = result.assets.map(a => a.uri);
      setImages(prev => [...prev, ...uris]);
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });
    if (!result.canceled) {
      setImages(prev => [...prev, result.assets[0].uri]);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      Alert.alert("Error", "Name and price are required");
      return;
    }
    setSaving(true);
    try {
      await api.put(`/products/${productId}`, {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        compareAtPrice: form.compareAtPrice
          ? parseFloat(form.compareAtPrice) : null,
        stockQuantity: parseInt(form.stockQuantity || "0"),
        sku: form.sku,
        isPublished: form.isPublished,
        trackInventory: form.trackInventory,
      });

      for (const uri of images.filter(u => u.startsWith("file"))) {
        const fd = new FormData();
        fd.append("file", {
          uri, type: "image/jpeg", name: "product.jpg"
        } as any);
        await api.post(
          `/upload/products/${productId}/images`, fd,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
      }

      Alert.alert("Success", "Product updated!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch {
      Alert.alert("Error", "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>? Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Product</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Product Name *</Text>
        <TextInput style={styles.input} value={form.name}
          onChangeText={(v: string) => setForm({ ...form, name: v })}
          placeholder="e.g. Red Ankara Dress" />

        <Text style={styles.label}>Description</Text>
        <TextInput style={[styles.input, styles.textarea]}
          value={form.description}
          onChangeText={(v: string) => setForm({ ...form, description: v })}
          placeholder="Describe your product..."
          multiline numberOfLines={4} />

        <Text style={styles.label}>Price (N) *</Text>
        <TextInput style={styles.input} value={form.price}
          onChangeText={(v: string) => setForm({ ...form, price: v })}
          placeholder="0.00" keyboardType="decimal-pad" />

        <Text style={styles.label}>Compare at Price (N)</Text>
        <TextInput style={styles.input} value={form.compareAtPrice}
          onChangeText={(v: string) => setForm({ ...form, compareAtPrice: v })}
          placeholder="0.00" keyboardType="decimal-pad" />

        <Text style={styles.label}>Stock Quantity</Text>
        <TextInput style={styles.input} value={form.stockQuantity}
          onChangeText={(v: string) => setForm({ ...form, stockQuantity: v })}
          placeholder="0" keyboardType="number-pad" />

        <Text style={styles.label}>SKU</Text>
        <TextInput style={styles.input} value={form.sku}
          onChangeText={(v: string) => setForm({ ...form, sku: v })}
          placeholder="e.g. SKU-001" />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Published</Text>
          <Switch value={form.isPublished}
            onValueChange={(v: boolean) =>
              setForm({ ...form, isPublished: v })}
            trackColor={{ true: "#7c3aed" }} />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Track Inventory</Text>
          <Switch value={form.trackInventory}
            onValueChange={(v: boolean) =>
              setForm({ ...form, trackInventory: v })}
            trackColor={{ true: "#7c3aed" }} />
        </View>

        <Text style={styles.label}>Photos</Text>
        <View style={styles.imageRow}>
          {images.map((uri, i) => (
            <Image key={i} source={{ uri }}
              style={styles.thumb} />
          ))}
          <TouchableOpacity style={styles.addPhoto} onPress={pickImage}>
            <Text style={styles.addPhotoText}>+ Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addPhoto} onPress={takePhoto}>
            <Text style={styles.addPhotoText}>?? Camera</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Save Changes</Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 20, paddingTop: 60, flexDirection: "row", alignItems: "center", gap: 16 },
  back: { fontSize: 16, color: "#7c3aed" },
  title: { fontSize: 20, fontWeight: "800", color: "#111827" },
  form: { padding: 20 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 14, fontSize: 15, color: "#111827" },
  textarea: { height: 100, textAlignVertical: "top" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  imageRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  thumb: { width: 80, height: 80, borderRadius: 8 },
  addPhoto: { width: 80, height: 80, borderRadius: 8, borderWidth: 1, borderColor: "#e5e7eb", borderStyle: "dashed", justifyContent: "center", alignItems: "center", backgroundColor: "#f9fafb" },
  addPhotoText: { fontSize: 11, color: "#6b7280", textAlign: "center" },
  button: { backgroundColor: "#7c3aed", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 24 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
