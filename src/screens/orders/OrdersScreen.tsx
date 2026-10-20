import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "../../api/api";

const PURPLE = "#7c3aed";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: Array<{ productName: string; quantity: number }>;
}

const STATUS_COLORS: Record<string, string> = {
  Pending: "#f59e0b",
  Confirmed: "#3b82f6",
  Processing: "#8b5cf6",
  Shipped: "#6366f1",
  Delivered: "#10b981",
  Cancelled: "#ef4444",
};

export default function OrdersScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders");
      setOrders(res.data.data?.orders ?? []);
    } catch {
      Alert.alert("Error", "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, []);

  const quickUpdateStatus = async (
    orderId: string,
    status: number,
    label: string,
  ) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      Alert.alert("✅", `Order marked as ${label}`);
      fetchOrders();
    } catch {
      Alert.alert("Error", "Failed to update order");
    }
  };

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase());
    if (filter === "all") return matchSearch;
    return matchSearch && o.status === filter;
  });

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate("OrderDetail", { orderId: item.id })}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderNumber}>{item.orderNumber}</Text>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: `${STATUS_COLORS[item.status] ?? "#6b7280"}20`,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: STATUS_COLORS[item.status] ?? "#6b7280" },
            ]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      <Text style={styles.customerName}>{item.customerName}</Text>
      <Text style={styles.itemsText} numberOfLines={1}>
        {item.items.map((i) => `${i.productName} x${i.quantity}`).join(", ")}
      </Text>

      <View style={styles.orderFooter}>
        <Text style={styles.orderTotal}>₦{item.total.toLocaleString()}</Text>
        <Text style={styles.orderDate}>
          {new Date(item.createdAt).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "short",
          })}
        </Text>
      </View>

      {/* Quick action buttons */}
      {item.status === "Pending" && (
        <TouchableOpacity
          style={styles.quickBtn}
          onPress={() => quickUpdateStatus(item.id, 1, "Confirmed")}
        >
          <Text style={styles.quickBtnText}>✅ Confirm Order</Text>
        </TouchableOpacity>
      )}
      {item.status === "Confirmed" && (
        <TouchableOpacity
          style={[styles.quickBtn, { backgroundColor: "#ede9fe" }]}
          onPress={() => quickUpdateStatus(item.id, 3, "Shipped")}
        >
          <Text style={[styles.quickBtnText, { color: PURPLE }]}>
            🚚 Mark as Shipped
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={[styles.searchBar, { paddingTop: insets.top + 12 }]}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="🔍 Search orders..."
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {["all", "Pending", "Shipped", "Delivered"].map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}
            >
              {f === "all" ? "All" : f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
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
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyText}>
              {loading ? "Loading..." : "No orders found"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  searchBar: {
    padding: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  searchInput: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  filterRow: {
    flexDirection: "row",
    padding: 10,
    gap: 8,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  filterBtnActive: {
    backgroundColor: PURPLE,
  },
  filterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
  },
  filterTextActive: {
    color: "white",
  },
  list: {
    padding: 12,
    paddingBottom: 80,
  },
  orderCard: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  orderNumber: {
    fontWeight: "800",
    color: "#111827",
    fontSize: 15,
  },
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  customerName: {
    fontWeight: "600",
    color: "#374151",
    fontSize: 14,
    marginBottom: 3,
  },
  itemsText: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 10,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderTotal: {
    fontWeight: "800",
    color: PURPLE,
    fontSize: 16,
  },
  orderDate: {
    fontSize: 12,
    color: "#9ca3af",
  },
  quickBtn: {
    marginTop: 10,
    backgroundColor: "#dcfce7",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  quickBtnText: {
    fontWeight: "700",
    color: "#16a34a",
    fontSize: 13,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 16,
  },
});
