import React, {
  useEffect, useState, useCallback
} from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl,
  TextInput, Alert, Image, Switch,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../api/api';

const PURPLE = '#7c3aed';

interface Product {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  isPublished: boolean;
  salesCount: number;
  trackInventory: boolean;
  images: Array<{ url: string; isPrimary: boolean }>;
  categoryName?: string;
}

export default function ProductsScreen({
  navigation
}: any) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products/my-products');
      setProducts(res.data.data?.products ?? []);
    } catch {
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Refresh when coming back from AddProduct
  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  }, []);

  const togglePublish = async (
    product: Product
  ) => {
    try {
      await api.put(
        `/products/${product.id}/toggle-publish`
      );
      setProducts(prev => prev.map(p =>
        p.id === product.id
          ? { ...p, isPublished: !p.isPublished }
          : p
      ));
    } catch {
      Alert.alert('Error', 'Failed to update product');
    }
  };

  const deleteProduct = (product: Product) => {
    Alert.alert(
      'Delete Product',
      `Delete "${product.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(
                `/products/${product.id}`
              );
              setProducts(prev =>
                prev.filter(p => p.id !== product.id)
              );
            } catch {
              Alert.alert(
                'Error', 'Failed to delete product'
              );
            }
          }
        }
      ]
    );
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase()
      .includes(search.toLowerCase());
    if (filter === 'published')
      return matchSearch && p.isPublished;
    if (filter === 'draft')
      return matchSearch && !p.isPublished;
    if (filter === 'low')
      return matchSearch &&
        p.trackInventory && p.stockQuantity <= 5;
    return matchSearch;
  });

  const renderProduct = ({
    item
  }: { item: Product }) => (
    <View style={styles.productCard}>
      <View style={styles.productContent}>
        {/* Image */}
        <View style={styles.imageBox}>
          {item.images[0] ? (
            <Image
              source={{ uri: item.images[0].url }}
              style={styles.productImage}
            />
          ) : (
            <Text style={styles.productEmoji}>📦</Text>
          )}
        </View>

        {/* Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}
            numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>
              ₦{item.price.toLocaleString()}
            </Text>
            {item.compareAtPrice && (
              <Text style={styles.comparePrice}>
                ₦{item.compareAtPrice.toLocaleString()}
              </Text>
            )}
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              {item.stockQuantity} in stock
            </Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>
              {item.salesCount} sold
            </Text>
          </View>

          {/* Stock warning */}
          {item.trackInventory &&
            item.stockQuantity <= 5 && (
            <View style={styles.stockWarn}>
              <Text style={styles.stockWarnText}>
                {item.stockQuantity === 0
                  ? '❌ Out of stock'
                  : `⚠️ Only ${item.stockQuantity} left`}
              </Text>
            </View>
          )}
        </View>

        {/* Publish Toggle */}
        <Switch
          value={item.isPublished}
          onValueChange={() => togglePublish(item)}
          trackColor={{
            false: '#e5e7eb', true: PURPLE
          }}
          thumbColor="white"
          style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.productActions}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigation.navigate(
            'EditProduct', { productId: item.id }
          )}>
          <Text style={styles.editBtnText}>
            ✏️ Edit
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => deleteProduct(item)}>
          <Text style={styles.deleteBtnText}>
            🗑️ Delete
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="🔍 Search products..."
          placeholderTextColor="#9ca3af"
        />
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() =>
            navigation.navigate('AddProduct')
          }>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {[
          { key: 'all', label: 'All' },
          { key: 'published', label: '🟢 Live' },
          { key: 'draft', label: '⚫ Draft' },
          { key: 'low', label: '⚠️ Low Stock' },
        ].map(f => (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.filterBtn,
              filter === f.key && styles.filterBtnActive
            ]}
            onPress={() => setFilter(f.key)}>
            <Text style={[
              styles.filterText,
              filter === f.key && styles.filterTextActive
            ]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Count */}
      <Text style={styles.count}>
        {filtered.length} product
        {filtered.length !== 1 ? 's' : ''}
      </Text>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderProduct}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[PURPLE]}
            tintColor={PURPLE}
          />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={styles.emptyTitle}>
              {loading
                ? 'Loading products...'
                : search
                  ? 'No products found'
                  : 'No products yet'
              }
            </Text>
            {!search && !loading && (
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() =>
                  navigation.navigate('AddProduct')
                }>
                <Text style={styles.emptyBtnText}>
                  Add First Product
                </Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  addBtn: {
    backgroundColor: PURPLE,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  addBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    padding: 10,
    gap: 6,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  filterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterBtnActive: {
    backgroundColor: PURPLE,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterTextActive: {
    color: 'white',
  },
  count: {
    fontSize: 12,
    color: '#9ca3af',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  list: {
    padding: 12,
    paddingBottom: 80,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productContent: {
    flexDirection: 'row',
    padding: 14,
    gap: 12,
    alignItems: 'flex-start',
  },
  imageBox: {
    width: 64,
    height: 64,
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  productImage: {
    width: 64,
    height: 64,
    resizeMode: 'cover',
  },
  productEmoji: {
    fontSize: 28,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontWeight: '700',
    color: '#111827',
    fontSize: 14,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  productPrice: {
    fontWeight: '800',
    color: PURPLE,
    fontSize: 15,
  },
  comparePrice: {
    fontSize: 12,
    color: '#d1d5db',
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  metaDot: {
    color: '#d1d5db',
  },
  stockWarn: {
    marginTop: 4,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  stockWarnText: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: '600',
  },
  productActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f9fafb',
  },
  editBtn: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#f9fafb',
    backgroundColor: '#f0f9ff',
  },
  editBtnText: {
    color: '#0369a1',
    fontWeight: '600',
    fontSize: 13,
  },
  deleteBtn: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#fff5f5',
  },
  deleteBtnText: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 13,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 16,
  },
  emptyBtn: {
    backgroundColor: PURPLE,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyBtnText: {
    color: 'white',
    fontWeight: '700',
  },
});