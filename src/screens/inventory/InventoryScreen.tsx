import React, {
  useEffect, useState, useCallback
} from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl,
  TextInput, Alert, Modal,
} from 'react-native';
import api from '../../api/api';

const PURPLE = '#7c3aed';

interface InventoryItem {
  productId: string;
  productName: string;
  sku?: string;
  currentStock: number;
  stockStatus: string;
  price: number;
  categoryName?: string;
}

export default function InventoryScreen() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [adjustItem, setAdjustItem] =
    useState<InventoryItem | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustType, setAdjustType] =
    useState<'add' | 'remove'>('add');
  const [adjustReason, setAdjustReason] =
    useState('Purchase');
  const [submitting, setSubmitting] = useState(false);

  const fetchInventory = async () => {
    try {
      let url = '/inventory';
      if (filter === 'low') url = '/inventory/low-stock';
      if (filter === 'out') url = '/inventory/out-of-stock';
      const res = await api.get(url);
      setItems(res.data.data ?? []);
    } catch {
      Alert.alert('Error', 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [filter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInventory();
    setRefreshing(false);
  }, [filter]);

  const handleAdjust = async () => {
    const qty = parseInt(adjustQty);
    if (!qty || qty <= 0) {
      Alert.alert('Error', 'Enter a valid quantity');
      return;
    }
    if (!adjustItem) return;

    setSubmitting(true);
    try {
      await api.post('/inventory/adjust', {
        productId: adjustItem.productId,
        quantity: adjustType === 'add' ? qty : -qty,
        reason: adjustReason,
      });
      Alert.alert('✅ Updated', 'Stock adjusted successfully');
      setAdjustItem(null);
      setAdjustQty('');
      fetchInventory();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message
          || 'Failed to adjust stock'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const stockColor = (status: string) => {
    const colors: Record<string, string> = {
      'In Stock': '#10b981',
      'Low Stock': '#f59e0b',
      'Out of Stock': '#ef4444',
      'Not Tracked': '#9ca3af',
    };
    return colors[status] ?? '#9ca3af';
  };

  const renderItem = ({
    item
  }: { item: InventoryItem }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemContent}>
        <View style={[
          styles.stockIndicator,
          { backgroundColor: stockColor(item.stockStatus) }
        ]}/>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}
            numberOfLines={1}>
            {item.productName}
          </Text>
          {item.sku && (
            <Text style={styles.itemSku}>
              SKU: {item.sku}
            </Text>
          )}
          <View style={[
            styles.statusBadge,
            {
              backgroundColor:
                `${stockColor(item.stockStatus)}20`
            }
          ]}>
            <Text style={[
              styles.statusText,
              { color: stockColor(item.stockStatus) }
            ]}>
              {item.stockStatus}
            </Text>
          </View>
        </View>
        <View style={styles.itemRight}>
          <Text style={[
            styles.stockNumber,
            {
              color: item.currentStock === 0
                ? '#ef4444'
                : item.currentStock <= 5
                  ? '#f59e0b'
                  : '#111827'
            }
          ]}>
            {item.currentStock}
          </Text>
          <Text style={styles.stockLabel}>units</Text>
          <TouchableOpacity
            style={styles.adjustBtn}
            onPress={() => {
              setAdjustItem(item);
              setAdjustQty('');
              setAdjustType('add');
              setAdjustReason('Purchase');
            }}>
            <Text style={styles.adjustBtnText}>
              Adjust
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>

      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        <SummaryPill
          label="In Stock"
          count={items.filter(
            i => i.stockStatus === 'In Stock'
          ).length}
          color="#10b981"
        />
        <SummaryPill
          label="Low Stock"
          count={items.filter(
            i => i.stockStatus === 'Low Stock'
          ).length}
          color="#f59e0b"
        />
        <SummaryPill
          label="Out of Stock"
          count={items.filter(
            i => i.stockStatus === 'Out of Stock'
          ).length}
          color="#ef4444"
        />
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        {[
          { key: 'all', label: 'All Products' },
          { key: 'low', label: '⚠️ Low Stock' },
          { key: 'out', label: '❌ Out of Stock' },
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

      {/* List */}
      <FlatList
        data={items}
        keyExtractor={item => item.productId}
        renderItem={renderItem}
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
            <Text style={styles.emptyText}>
              {loading ? 'Loading...' : 'No items found'}
            </Text>
          </View>
        }
      />

      {/* Adjust Modal */}
      <Modal
        visible={adjustItem !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setAdjustItem(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              Adjust Stock
            </Text>
            <Text style={styles.modalProduct}
              numberOfLines={1}>
              {adjustItem?.productName}
            </Text>
            <Text style={styles.modalCurrent}>
              Current: {adjustItem?.currentStock} units
            </Text>

            {/* Add/Remove Toggle */}
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  adjustType === 'add' &&
                    styles.typeBtnAdd
                ]}
                onPress={() => setAdjustType('add')}>
                <Text style={[
                  styles.typeBtnText,
                  adjustType === 'add' && {
                    color: 'white'
                  }
                ]}>
                  ➕ Add
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeBtn,
                  adjustType === 'remove' &&
                    styles.typeBtnRemove
                ]}
                onPress={() => setAdjustType('remove')}>
                <Text style={[
                  styles.typeBtnText,
                  adjustType === 'remove' && {
                    color: 'white'
                  }
                ]}>
                  ➖ Remove
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.qtyInput}
              value={adjustQty}
              onChangeText={setAdjustQty}
              placeholder="Quantity"
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
              autoFocus
            />

            {/* Reason */}
            <View style={styles.reasonRow}>
              {['Purchase', 'Return', 'Damaged',
                'Correction'].map(r => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.reasonBtn,
                    adjustReason === r &&
                      styles.reasonBtnActive
                  ]}
                  onPress={() => setAdjustReason(r)}>
                  <Text style={[
                    styles.reasonText,
                    adjustReason === r && {
                      color: PURPLE
                    }
                  ]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setAdjustItem(null)}>
                <Text style={styles.modalCancelText}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  {
                    backgroundColor:
                      adjustType === 'add'
                        ? '#10b981'
                        : '#ef4444'
                  }
                ]}
                onPress={handleAdjust}
                disabled={submitting}>
                <Text style={styles.modalConfirmText}>
                  {submitting
                    ? 'Saving...'
                    : adjustType === 'add'
                      ? 'Add Stock'
                      : 'Remove Stock'
                  }
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const SummaryPill = ({
  label, count, color
}: {
  label: string;
  count: number;
  color: string;
}) => (
  <View style={[
    pillStyles.pill,
    { backgroundColor: `${color}15` }
  ]}>
    <Text style={[pillStyles.count, { color }]}>
      {count}
    </Text>
    <Text style={[pillStyles.label, { color }]}>
      {label}
    </Text>
  </View>
);

const pillStyles = StyleSheet.create({
  pill: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
  },
  count: {
    fontSize: 22,
    fontWeight: '800',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  summaryBar: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
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
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  list: {
    padding: 12,
    paddingBottom: 80,
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  stockIndicator: {
    width: 6,
    height: '100%',
    borderRadius: 3,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  itemInfo: {
    flex: 1,
    paddingLeft: 8,
  },
  itemName: {
    fontWeight: '700',
    color: '#111827',
    fontSize: 14,
    marginBottom: 3,
  },
  itemSku: {
    fontSize: 12,
    color: '#9ca3af',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  itemRight: {
    alignItems: 'center',
    minWidth: 70,
  },
  stockNumber: {
    fontSize: 28,
    fontWeight: '800',
  },
  stockLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 8,
  },
  adjustBtn: {
    backgroundColor: '#ede9fe',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  adjustBtnText: {
    color: PURPLE,
    fontWeight: '700',
    fontSize: 12,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  modalProduct: {
    fontSize: 15,
    color: PURPLE,
    fontWeight: '600',
    marginBottom: 4,
  },
  modalCurrent: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 16,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  typeBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  typeBtnAdd: {
    backgroundColor: '#10b981',
  },
  typeBtnRemove: {
    backgroundColor: '#ef4444',
  },
  typeBtnText: {
    fontWeight: '700',
    color: '#374151',
    fontSize: 14,
  },
  qtyInput: {
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 14,
  },
  reasonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  reasonBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  reasonBtnActive: {
    backgroundColor: '#ede9fe',
    borderWidth: 1.5,
    borderColor: PURPLE,
  },
  reasonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  modalCancelText: {
    fontWeight: '700',
    color: '#6b7280',
    fontSize: 15,
  },
  modalConfirmBtn: {
    flex: 2,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 15,
  },
});