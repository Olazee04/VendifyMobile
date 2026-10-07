import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl,
  Dimensions, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';

const { width } = Dimensions.get('window');
const PURPLE = '#7c3aed';

interface DashboardData {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  pendingOrders: number;
  lowStockProducts: number;
  revenueThisMonth: number;
  ordersThisMonth: number;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    salesCount: number;
    revenue: number;
  }>;
}

export default function DashboardScreen({
  navigation
}: any) {
  const { user, logout } = useAuth();
  const [data, setData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/analytics/dashboard');
      setData(res.data.data);
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // Poll every 30 seconds for new orders
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      Pending: '#f59e0b',
      Confirmed: '#3b82f6',
      Processing: '#8b5cf6',
      Shipped: '#6366f1',
      Delivered: '#10b981',
      Cancelled: '#ef4444',
    };
    return colors[status] ?? '#6b7280';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          Loading dashboard...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[PURPLE]}
          tintColor={PURPLE}
        />
      }
      showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            Hi, {user?.firstName}! 👋
          </Text>
          <Text style={styles.subGreeting}>
            Here&apos;s your store overview
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Alert — Pending Orders */}
      {(data?.pendingOrders ?? 0) > 0 && (
        <TouchableOpacity
          style={styles.alert}
          onPress={() => navigation.navigate('Orders')}>
          <Text style={styles.alertEmoji}>🔔</Text>
          <Text style={styles.alertText}>
            {data?.pendingOrders} new order
            {(data?.pendingOrders ?? 0) > 1
              ? 's need' : ' needs'} attention!
          </Text>
          <Text style={styles.alertArrow}>→</Text>
        </TouchableOpacity>
      )}

      {/* Low Stock Alert */}
      {(data?.lowStockProducts ?? 0) > 0 && (
        <TouchableOpacity style={styles.alertWarning}>
          <Text style={styles.alertEmoji}>⚠️</Text>
          <Text style={[
            styles.alertText, { color: '#92400e' }
          ]}>
            {data?.lowStockProducts} product
            {(data?.lowStockProducts ?? 0) > 1
              ? 's are' : ' is'} low on stock
          </Text>
        </TouchableOpacity>
      )}

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          label="Total Revenue"
          value={`₦${(data?.totalRevenue ?? 0)
            .toLocaleString()}`}
          sub={`₦${(data?.revenueThisMonth ?? 0)
            .toLocaleString()} this month`}
          emoji="💰"
          color="#7c3aed"
          bg="#f5f3ff"
        />
        <StatCard
          label="Total Orders"
          value={data?.totalOrders ?? 0}
          sub={`${data?.ordersThisMonth ?? 0} this month`}
          emoji="🛒"
          color="#2563eb"
          bg="#eff6ff"
        />
        <StatCard
          label="Products"
          value={data?.totalProducts ?? 0}
          sub="in your store"
          emoji="📦"
          color="#059669"
          bg="#ecfdf5"
        />
        <StatCard
          label="Customers"
          value={data?.totalCustomers ?? 0}
          sub="total buyers"
          emoji="👥"
          color="#d97706"
          bg="#fffbeb"
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Quick Actions
        </Text>
        <View style={styles.actionsGrid}>
          {[
            {
              emoji: '➕',
              label: 'Add Product',
              onPress: () =>
                navigation.navigate('AddProduct'),
              color: '#f5f3ff',
            },
            {
              emoji: '📋',
              label: 'View Orders',
              onPress: () => navigation.navigate('Orders'),
              color: '#eff6ff',
            },
            {
              emoji: '🏪',
              label: 'My Store',
              onPress: () => navigation.navigate('Store'),
              color: '#ecfdf5',
            },
            {
              emoji: '🔔',
              label: 'Alerts',
              onPress: () => navigation.navigate('Alerts'),
              color: '#fef3c7',
            },
          ].map((action) => (
            <TouchableOpacity
              key={action.label}
              style={[
                styles.actionBtn,
                { backgroundColor: action.color }
              ]}
              onPress={action.onPress}>
              <Text style={styles.actionEmoji}>
                {action.emoji}
              </Text>
              <Text style={styles.actionLabel}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Orders */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Recent Orders
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Orders')}>
            <Text style={styles.seeAll}>See all →</Text>
          </TouchableOpacity>
        </View>

        {(data?.recentOrders ?? []).length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🛒</Text>
            <Text style={styles.emptyText}>
              No orders yet
            </Text>
            <Text style={styles.emptySubtext}>
              Share your store to get orders
            </Text>
          </View>
        ) : (
          data?.recentOrders.map((order) => (
            <TouchableOpacity
              key={order.id}
              style={styles.orderRow}
              onPress={() => navigation.navigate(
                'OrderDetail', { orderId: order.id }
              )}>
              <View style={styles.orderLeft}>
                <Text style={styles.orderNumber}>
                  {order.orderNumber}
                </Text>
                <Text style={styles.orderCustomer}>
                  {order.customerName}
                </Text>
              </View>
              <View style={styles.orderRight}>
                <Text style={styles.orderTotal}>
                  ₦{order.total.toLocaleString()}
                </Text>
                <View style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      `${statusColor(order.status)}20`
                  }
                ]}>
                  <Text style={[
                    styles.statusText,
                    { color: statusColor(order.status) }
                  ]}>
                    {order.status}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Top Products */}
      <View style={[styles.section, { marginBottom: 100 }]}>
        <Text style={styles.sectionTitle}>
          Top Products
        </Text>
        {(data?.topProducts ?? []).length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={styles.emptyText}>
              No sales yet
            </Text>
          </View>
        ) : (
          data?.topProducts.map((product, index) => (
            <View key={product.id} style={styles.productRow}>
              <Text style={styles.productRank}>
                #{index + 1}
              </Text>
              <View style={styles.productInfo}>
                <Text style={styles.productName}
                  numberOfLines={1}>
                  {product.name}
                </Text>
                <Text style={styles.productSales}>
                  {product.salesCount} sold
                </Text>
              </View>
              <Text style={styles.productRevenue}>
                ₦{product.revenue.toLocaleString()}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

// StatCard Component
const StatCard = ({
  label, value, sub, emoji, color, bg
}: {
  label: string;
  value: any;
  sub: string;
  emoji: string;
  color: string;
  bg: string;
}) => (
  <View style={[styles.statCard, { backgroundColor: bg }]}>
    <Text style={styles.statEmoji}>{emoji}</Text>
    <Text style={[styles.statValue, { color }]}>
      {value}
    </Text>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statSub}>{sub}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    color: PURPLE,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  greeting: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  subGreeting: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  logoutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 10,
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 13,
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ede9fe',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd6fe',
  },
  alertWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  alertEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#4c1d95',
  },
  alertArrow: {
    color: PURPLE,
    fontWeight: '700',
    fontSize: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
    paddingTop: 16,
  },
  statCard: {
    width: (width - 40) / 2,
    borderRadius: 16,
    padding: 16,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  statSub: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  seeAll: {
    color: PURPLE,
    fontWeight: '600',
    fontSize: 13,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionBtn: {
    width: (width - 52) / 2,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  actionEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  orderLeft: {
    flex: 1,
  },
  orderNumber: {
    fontWeight: '700',
    color: '#111827',
    fontSize: 14,
  },
  orderCustomer: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 2,
  },
  orderRight: {
    alignItems: 'flex-end',
  },
  orderTotal: {
    fontWeight: '800',
    color: '#111827',
    fontSize: 14,
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  productRank: {
    fontSize: 16,
    fontWeight: '800',
    color: '#d1d5db',
    width: 32,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontWeight: '600',
    color: '#111827',
    fontSize: 14,
  },
  productSales: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 2,
  },
  productRevenue: {
    fontWeight: '800',
    color: PURPLE,
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'white',
    borderRadius: 16,
  },
  emptyEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyText: {
    fontWeight: '700',
    color: '#374151',
    fontSize: 16,
  },
  emptySubtext: {
    color: '#9ca3af',
    fontSize: 13,
    marginTop: 4,
  },
});