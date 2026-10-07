import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert,
  ActivityIndicator, Image, Switch,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../../api/api';

const PURPLE = '#7c3aed';

export default function AddProductScreen({
  navigation
}: any) {
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] =
    useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    compareAtPrice: '',
    stockQuantity: '0',
    sku: '',
    tags: '',
    trackInventory: true,
    isPublished: true,
  });

  const pickImageFromCamera = async () => {
    const permission = await ImagePicker
      .requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        'Camera access is required to take product photos'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  const pickImageFromGallery = async () => {
    const result = await ImagePicker
      .launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Product Image',
      'Choose a source',
      [
        {
          text: '📷 Take Photo',
          onPress: pickImageFromCamera
        },
        {
          text: '🖼️ Choose from Gallery',
          onPress: pickImageFromGallery
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleCreate = async () => {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Product name is required');
      return;
    }
    if (!form.price || parseFloat(form.price) <= 0) {
      Alert.alert('Error', 'Valid price is required');
      return;
    }

    setLoading(true);
    try {
      // Create product first
      const res = await api.post('/products', {
        name: form.name.trim(),
        description: form.description || undefined,
        price: parseFloat(form.price),
        compareAtPrice: form.compareAtPrice
          ? parseFloat(form.compareAtPrice)
          : undefined,
        stockQuantity: parseInt(form.stockQuantity) || 0,
        sku: form.sku || undefined,
        tags: form.tags || undefined,
        trackInventory: form.trackInventory,
        isPublished: form.isPublished,
      });

      const productId = res.data.data.id;

      // Upload image if selected
      if (image) {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append('file', {
          uri: image,
          type: 'image/jpeg',
          name: 'product.jpg',
        } as any);
        formData.append('isPrimary', 'true');

        await api.post(
          `/upload/products/${productId}/images`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      }

      Alert.alert(
        '✅ Product Created!',
        `"${form.name}" has been added to your store`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message
          || 'Failed to create product'
      );
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">

        {/* Image Upload */}
        <TouchableOpacity
          style={styles.imageUpload}
          onPress={showImageOptions}>
          {image ? (
            <Image
              source={{ uri: image }}
              style={styles.productImage}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.cameraEmoji}>📷</Text>
              <Text style={styles.imageText}>
                Tap to add photo
              </Text>
              <Text style={styles.imageSubtext}>
                Camera or Gallery
              </Text>
            </View>
          )}
          {image && (
            <View style={styles.changePhotoBtn}>
              <Text style={styles.changePhotoText}>
                Change Photo
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Product Info
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(v) =>
                setForm({ ...form, name: v })
              }
              placeholder="e.g. Red Ankara Dress"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={form.description}
              onChangeText={(v) =>
                setForm({ ...form, description: v })
              }
              placeholder="Describe your product..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Pricing</Text>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Price (₦) *</Text>
              <TextInput
                style={styles.input}
                value={form.price}
                onChangeText={(v) =>
                  setForm({ ...form, price: v })
                }
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View style={{ width: 12 }}/>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>
                Compare At (₦)
              </Text>
              <TextInput
                style={styles.input}
                value={form.compareAtPrice}
                onChangeText={(v) =>
                  setForm({ ...form, compareAtPrice: v })
                }
                placeholder="Original"
                keyboardType="numeric"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Inventory
          </Text>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Stock Qty</Text>
              <TextInput
                style={styles.input}
                value={form.stockQuantity}
                onChangeText={(v) =>
                  setForm({ ...form, stockQuantity: v })
                }
                keyboardType="numeric"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View style={{ width: 12 }}/>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>SKU</Text>
              <TextInput
                style={styles.input}
                value={form.sku}
                onChangeText={(v) =>
                  setForm({ ...form, sku: v })
                }
                placeholder="SKU-001"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>

          <View style={styles.toggle}>
            <View>
              <Text style={styles.toggleLabel}>
                Track Inventory
              </Text>
              <Text style={styles.toggleSub}>
                Monitor stock levels
              </Text>
            </View>
            <Switch
              value={form.trackInventory}
              onValueChange={(v) =>
                setForm({ ...form, trackInventory: v })
              }
              trackColor={{
                false: '#e5e7eb', true: PURPLE
              }}
              thumbColor="white"
            />
          </View>

          <View style={styles.toggle}>
            <View>
              <Text style={styles.toggleLabel}>
                Publish Now
              </Text>
              <Text style={styles.toggleSub}>
                Visible to customers
              </Text>
            </View>
            <Switch
              value={form.isPublished}
              onValueChange={(v) =>
                setForm({ ...form, isPublished: v })
              }
              trackColor={{
                false: '#e5e7eb', true: PURPLE
              }}
              thumbColor="white"
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.field}>
            <Text style={styles.label}>
              Tags (comma separated)
            </Text>
            <TextInput
              style={styles.input}
              value={form.tags}
              onChangeText={(v) =>
                setForm({ ...form, tags: v })
              }
              placeholder="fashion, ankara, women"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.createBtn,
            loading && styles.btnDisabled
          ]}
          onPress={handleCreate}
          disabled={loading}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="white"/>
              <Text style={styles.createBtnText}>
                {uploadingImage
                  ? 'Uploading image...'
                  : 'Creating product...'
                }
              </Text>
            </View>
          ) : (
            <Text style={styles.createBtnText}>
              ✅ Create Product
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }}/>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scroll: {
    padding: 16,
  },
  imageUpload: {
    height: 200,
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  imageText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  imageSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  changePhotoBtn: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    alignItems: 'center',
  },
  changePhotoText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 13,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 14,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#fafafa',
  },
  textarea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  toggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  toggleSub: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  createBtn: {
    backgroundColor: PURPLE,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  createBtnText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '800',
  },
  loadingRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
});