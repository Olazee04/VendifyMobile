import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, RefreshControl
} from "react-native";
import api from "../../api/api";

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  topProducts: { name: string; sales: number; revenue: number }[];
  ordersByMonth: { month: string; orders: number }[];
}

export default function AnalyticsScreen() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get("/analytics/dashboard");
      setData(res.data.data);
    } catch (e) {
      console.error("Analytics error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  const stats = [
    { label: "Revenue", value: `N${(data?.totalRevenue ?? 0).toLocaleString()}`, color: "#7c3aed", bg: "#f5f3ff" },
    { label: "Orders", value: String(data?.totalOrders ?? 0), color: "#2563eb", bg: "#eff6ff" },
    { label: "Products", value: String(data?.totalProducts ?? 0), color: "#059669", bg: "#f0fdf4" },
    { label: "Customers", value: String(data?.totalCustomers ?? 0), color: "#d97706", bg: "#fffbeb" },
  ];

  const maxOrders = Math.max(...(data?.ordersByMonth?.map(d => d.orders) ?? [1]), 1);
  const topProducts = data?.topProducts ?? [];
  const maxSales = Math.max(...topProducts.map(p => p.sales), 1);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAnalytics(); }} colors={["#7c3aed"]} />
      }>

      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
        <Text style={styles.subtitle}>Your store performance</Text>
      </View>

      <View style={styles.statsGrid}>
        {stats.map(stat => (
          <View key={stat.label} style={[styles.statCard, { backgroundColor: stat.bg }]}>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {(data?.ordersByMonth?.length ?? 0) > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Orders by Month</Text>
          <View style={styles.barChart}>
            {data!.ordersByMonth.map((d, i) => (
              <View key={i} style={styles.barGroup}>
                <Text style={styles.barValue}>{d.orders}</Text>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, {
                    height: Math.max((d.orders / maxOrders) * 100, 4),
                    backgroundColor: "#7c3aed"
                  }]} />
                </View>
                <Text style={styles.barLabel}>{d.month.slice(0, 3)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {topProducts.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top Products</Text>
          {topProducts.slice(0, 5).map((product, i) => (
            <View key={i} style={styles.productRow}>
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                <Text style={styles.productSales}>{product.sales} sold</Text>
              </View>
              <View style={styles.progressContainer}>
                <View style={[styles.progress, { width: `${(product.sales / maxSales) * 100}%` }]} />
              </View>
              <Text style={styles.productRevenue}>N{product.revenue.toLocaleString()}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 20, paddingTop: 60, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: "800", color: "#111827" },
  subtitle: { fontSize: 14, color: "#6b7280", marginTop: 2 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", padding: 12, gap: 8 },
  statCard: { flex: 1, minWidth: "45%", borderRadius: 16, padding: 16, margin: 4 },
  statValue: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 12, color: "#6b7280", marginTop: 4 },
  card: { backgroundColor: "#fff", borderRadius: 16, margin: 12, padding: 16, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 16 },
  barChart: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around", height: 130 },
  barGroup: { alignItems: "center", flex: 1 },
  barValue: { fontSize: 10, color: "#6b7280", marginBottom: 4 },
  barContainer: { width: 24, height: 100, justifyContent: "flex-end" },
  bar: { width: 24, borderRadius: 4 },
  barLabel: { fontSize: 10, color: "#6b7280", marginTop: 4 },
  productRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 },
  productInfo: { width: 100 },
  productName: { fontSize: 12, fontWeight: "600", color: "#111827" },
  productSales: { fontSize: 11, color: "#6b7280" },
  progressContainer: { flex: 1, height: 8, backgroundColor: "#f3f4f6", borderRadius: 4, overflow: "hidden" },
  progress: { height: 8, backgroundColor: "#7c3aed", borderRadius: 4 },
  productRevenue: { fontSize: 11, fontWeight: "700", color: "#7c3aed", width: 80, textAlign: "right" },
});