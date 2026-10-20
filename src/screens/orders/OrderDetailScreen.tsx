import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variantInfo?: string;
}

interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  phoneNumber: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  couponCode?: string;
  notes?: string;
  trackingNumber?: string;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
}

const STATUS_COLORS: Record<string, string> = {
  Pending: "#f59e0b",
  Confirmed: "#3b82f6",
  Processing: "#8b5cf6",
  Shipped: "#6366f1",
  Delivered: "#10b981",
  Cancelled: "#ef4444",
};

const STATUS_STEPS = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
];

export default function OrderDetailScreen({ route, navigation }: any) {
  const { orderId } = route.params;
  const insets = useSafeAreaInsets();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [showTrackingInput, setShowTrackingInput] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${orderId}`);
      const o = res.data.data;
      setOrder(o);
      setTrackingNumber(o.trackingNumber ?? "");
    } catch {
      Alert.alert("Error", "Failed to load order");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (
    status: number,
    label: string,
    tracking?: string,
  ) => {
    setUpdating(true);
    try {
      await api.put(`/orders/${orderId}/status`, {
        status,
        trackingNumber: tracking || undefined,
      });
      Alert.alert("✅ Updated", `Order marked as ${label}`);
      setShowTrackingInput(false);
      fetchOrder();
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to update order",
      );
    } finally {
      setUpdating(false);
    }
  };

  const cancelOrder = () => {
    Alert.alert("Cancel Order", "Are you sure? Stock will be restored.", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          setUpdating(true);
          try {
            await api.put(`/orders/${orderId}/cancel`);
            Alert.alert("Order cancelled");
            fetchOrder();
          } catch {
            Alert.alert("Error", "Cannot cancel this order");
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  };

  const callCustomer = () => {
    if (order?.customerPhone) {
      Linking.openURL(`tel:${order.customerPhone}`);
    }
  };

  const whatsAppCustomer = () => {
    if (!order) return;
    const phone = order.customerPhone.replace(/\D/g, "").replace(/^0/, "234");
    const msg = encodeURIComponent(
      `Hi ${order.customerName}! Your order ` +
        `*${order.orderNumber}* status: *${order.status}*` +
        `${order.trackingNumber ? `\nTracking: ${order.trackingNumber}` : ""}` +
        `\n\nThank you! 🛍️`,
    );
    Linking.openURL(`https://wa.me/${phone}?text=${msg}`);
  };

  const currentStep = STATUS_STEPS.indexOf(order?.status ?? "Pending");

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={PURPLE} size="large" />
        <Text style={styles.loadingText}>Loading order...</Text>
      </View>
    );
  }

  if (!order) return null;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Order Header */}
      <View style={[styles.headerCard, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTop}>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: `${STATUS_COLORS[order.status] ?? "#6b7280"}20`,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color: STATUS_COLORS[order.status] ?? "#6b7280",
                },
              ]}
            >
              {order.status}
            </Text>
          </View>
        </View>
        <Text style={styles.orderDate}>
          {new Date(order.createdAt).toLocaleDateString("en-NG", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>

        {/* Payment Status */}
        <View style={styles.paymentRow}>
          <View
            style={[
              styles.paymentBadge,
              {
                backgroundColor:
                  order.paymentStatus === "Paid" ? "#dcfce7" : "#fef2f2",
              },
            ]}
          >
            <Text
              style={[
                styles.paymentText,
                {
                  color: order.paymentStatus === "Paid" ? "#16a34a" : "#dc2626",
                },
              ]}
            >
              💳 {order.paymentStatus}
            </Text>
          </View>
          {order.paymentMethod && (
            <Text style={styles.paymentMethod}>via {order.paymentMethod}</Text>
          )}
        </View>
      </View>

      {/* Progress Tracker */}
      {order.status !== "Cancelled" && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Progress</Text>
          <View style={styles.progressContainer}>
            {STATUS_STEPS.map((step, index) => {
              const isDone = currentStep >= index;
              const isCurrent = currentStep === index;
              return (
                <View key={step} style={styles.progressStep}>
                  <View
                    style={[
                      styles.progressDot,
                      isDone && styles.progressDotDone,
                      isCurrent && styles.progressDotCurrent,
                    ]}
                  >
                    {isDone && <Text style={styles.progressCheck}>✓</Text>}
                  </View>
                  <Text
                    style={[
                      styles.progressLabel,
                      isCurrent && styles.progressLabelActive,
                    ]}
                  >
                    {step}
                  </Text>
                  {index < STATUS_STEPS.length - 1 && (
                    <View
                      style={[
                        styles.progressLine,
                        isDone &&
                          index < currentStep &&
                          styles.progressLineDone,
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Customer Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Customer</Text>
        <View style={styles.customerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {order.customerName[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{order.customerName}</Text>
            <Text style={styles.customerContact}>{order.customerEmail}</Text>
            <Text style={styles.customerContact}>{order.customerPhone}</Text>
          </View>
        </View>
        <View style={styles.contactBtns}>
          <TouchableOpacity style={styles.contactBtn} onPress={callCustomer}>
            <Text style={styles.contactBtnText}>📞 Call</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.contactBtn, { backgroundColor: "#dcfce7" }]}
            onPress={whatsAppCustomer}
          >
            <Text style={[styles.contactBtnText, { color: "#16a34a" }]}>
              💬 WhatsApp
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Order Items */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Items ({order.items.length})</Text>
        {order.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.itemIconBox}>
              <Text style={styles.itemIcon}>📦</Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.productName}
              </Text>
              {item.variantInfo && (
                <Text style={styles.itemVariant}>{item.variantInfo}</Text>
              )}
              <Text style={styles.itemUnit}>
                ₦{item.unitPrice.toLocaleString()} each
              </Text>
            </View>
            <View style={styles.itemRight}>
              <Text style={styles.itemTotal}>
                ₦{item.totalPrice.toLocaleString()}
              </Text>
              <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
            </View>
          </View>
        ))}

        {/* Price Summary */}
        <View style={styles.priceSummary}>
          <SummaryRow
            label="Subtotal"
            value={`₦${order.subtotal.toLocaleString()}`}
          />
          {order.shippingFee > 0 && (
            <SummaryRow
              label="Shipping"
              value={`₦${order.shippingFee.toLocaleString()}`}
            />
          )}
          {order.discount > 0 && (
            <SummaryRow
              label={`Discount${
                order.couponCode ? ` (${order.couponCode})` : ""
              }`}
              value={`-₦${order.discount.toLocaleString()}`}
              green
            />
          )}
          <SummaryRow
            label="Total"
            value={`₦${order.total.toLocaleString()}`}
            bold
          />
        </View>
      </View>

      {/* Delivery Address */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Delivery Address</Text>
        <View style={styles.addressBox}>
          <Text style={styles.addressName}>
            {order.shippingAddress.fullName}
          </Text>
          <Text style={styles.addressLine}>
            {order.shippingAddress.addressLine1}
          </Text>
          {order.shippingAddress.addressLine2 && (
            <Text style={styles.addressLine}>
              {order.shippingAddress.addressLine2}
            </Text>
          )}
          <Text style={styles.addressLine}>
            {order.shippingAddress.city}, {order.shippingAddress.state}
          </Text>
          <Text style={styles.addressLine}>
            {order.shippingAddress.country}
          </Text>
          <Text style={[styles.addressLine, { color: PURPLE }]}>
            📞 {order.shippingAddress.phoneNumber}
          </Text>
        </View>

        {order.trackingNumber && (
          <View style={styles.trackingBox}>
            <Text style={styles.trackingLabel}>🚚 Tracking Number</Text>
            <Text style={styles.trackingNumber}>{order.trackingNumber}</Text>
          </View>
        )}
      </View>

      {/* Customer Notes */}
      {order.notes && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer Notes</Text>
          <View style={styles.notesBox}>
            <Text style={styles.notesText}>&ldquo;{order.notes}&rdquo;</Text>
          </View>
        </View>
      )}

      {/* Update Status Actions */}
      {order.status !== "Cancelled" && order.status !== "Delivered" && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Update Status</Text>

          {updating && (
            <ActivityIndicator color={PURPLE} style={{ marginBottom: 12 }} />
          )}

          {order.status === "Pending" && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => updateStatus(1, "Confirmed")}
              disabled={updating}
            >
              <Text style={styles.actionBtnText}>✅ Confirm Order</Text>
            </TouchableOpacity>
          )}

          {(order.status === "Confirmed" || order.status === "Processing") && (
            <>
              {!showTrackingInput ? (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: "#ede9fe" }]}
                  onPress={() => setShowTrackingInput(true)}
                  disabled={updating}
                >
                  <Text style={[styles.actionBtnText, { color: PURPLE }]}>
                    🚚 Mark as Shipped
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.trackingInputBox}>
                  <TextInput
                    style={styles.trackingInput}
                    value={trackingNumber}
                    onChangeText={setTrackingNumber}
                    placeholder="Tracking number (optional)"
                    placeholderTextColor="#9ca3af"
                  />
                  <View style={styles.trackingBtns}>
                    <TouchableOpacity
                      style={styles.trackingConfirmBtn}
                      onPress={() => updateStatus(3, "Shipped", trackingNumber)}
                      disabled={updating}
                    >
                      <Text style={styles.trackingConfirmText}>
                        Confirm Shipped
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setShowTrackingInput(false)}
                      style={styles.trackingCancelBtn}
                    >
                      <Text style={styles.trackingCancelText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}

          {order.status === "Shipped" && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#dcfce7" }]}
              onPress={() => updateStatus(4, "Delivered")}
              disabled={updating}
            >
              <Text style={[styles.actionBtnText, { color: "#16a34a" }]}>
                📬 Mark as Delivered
              </Text>
            </TouchableOpacity>
          )}

          {order.status !== "Shipped" && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: "#fef2f2", marginTop: 8 },
              ]}
              onPress={cancelOrder}
              disabled={updating}
            >
              <Text style={[styles.actionBtnText, { color: "#dc2626" }]}>
                ❌ Cancel Order
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Completed State */}
      {order.status === "Delivered" && (
        <View style={[styles.card, styles.completedCard]}>
          <Text style={styles.completedEmoji}>🎉</Text>
          <Text style={styles.completedTitle}>Order Delivered!</Text>
          {order.deliveredAt && (
            <Text style={styles.completedDate}>
              {new Date(order.deliveredAt).toLocaleDateString("en-NG", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
          )}
        </View>
      )}

      {order.status === "Cancelled" && (
        <View style={[styles.card, styles.cancelledCard]}>
          <Text style={styles.completedEmoji}>❌</Text>
          <Text style={[styles.completedTitle, { color: "#dc2626" }]}>
            Order Cancelled
          </Text>
          <Text style={styles.completedDate}>Stock has been restored</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// Summary Row Component
const SummaryRow = ({
  label,
  value,
  bold,
  green,
}: {
  label: string;
  value: string;
  bold?: boolean;
  green?: boolean;
}) => (
  <View style={summaryStyles.row}>
    <Text style={[summaryStyles.label, bold && summaryStyles.bold]}>
      {label}
    </Text>
    <Text
      style={[
        summaryStyles.value,
        bold && summaryStyles.bold,
        green && summaryStyles.green,
      ]}
    >
      {value}
    </Text>
  </View>
);

const summaryStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  label: {
    fontSize: 14,
    color: "#6b7280",
  },
  value: {
    fontSize: 14,
    color: "#111827",
  },
  bold: {
    fontWeight: "800",
    fontSize: 16,
    color: PURPLE,
  },
  green: {
    color: "#16a34a",
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
    gap: 12,
  },
  loadingText: {
    color: "#6b7280",
    fontSize: 14,
  },
  headerCard: {
    backgroundColor: "white",
    padding: 16,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
  },
  orderDate: {
    fontSize: 13,
    color: "#9ca3af",
    marginBottom: 10,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  paymentBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  paymentText: {
    fontSize: 12,
    fontWeight: "700",
  },
  paymentMethod: {
    fontSize: 12,
    color: "#9ca3af",
  },
  card: {
    backgroundColor: "white",
    marginHorizontal: 12,
    marginBottom: 12,
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
  progressContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  progressStep: {
    alignItems: "center",
    flex: 1,
    position: "relative",
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    zIndex: 1,
  },
  progressDotDone: {
    backgroundColor: PURPLE,
  },
  progressDotCurrent: {
    backgroundColor: PURPLE,
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  progressCheck: {
    color: "white",
    fontSize: 12,
    fontWeight: "800",
  },
  progressLabel: {
    fontSize: 10,
    color: "#9ca3af",
    textAlign: "center",
    fontWeight: "500",
  },
  progressLabelActive: {
    color: PURPLE,
    fontWeight: "700",
  },
  progressLine: {
    position: "absolute",
    top: 14,
    left: "60%",
    right: "-60%",
    height: 2,
    backgroundColor: "#e5e7eb",
  },
  progressLineDone: {
    backgroundColor: PURPLE,
  },
  customerRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ede9fe",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: PURPLE,
    fontWeight: "800",
    fontSize: 18,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontWeight: "700",
    color: "#111827",
    fontSize: 15,
  },
  customerContact: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  contactBtns: {
    flexDirection: "row",
    gap: 10,
  },
  contactBtn: {
    flex: 1,
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  contactBtnText: {
    fontWeight: "700",
    color: "#2563eb",
    fontSize: 13,
  },
  itemRow: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f9fafb",
  },
  itemIconBox: {
    width: 44,
    height: 44,
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  itemIcon: {
    fontSize: 20,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontWeight: "600",
    color: "#111827",
    fontSize: 14,
  },
  itemVariant: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  itemUnit: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  itemRight: {
    alignItems: "flex-end",
  },
  itemTotal: {
    fontWeight: "800",
    color: "#111827",
    fontSize: 14,
  },
  itemQty: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  priceSummary: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  addressBox: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 14,
    gap: 3,
  },
  addressName: {
    fontWeight: "700",
    color: "#111827",
    fontSize: 15,
    marginBottom: 4,
  },
  addressLine: {
    fontSize: 14,
    color: "#6b7280",
  },
  trackingBox: {
    marginTop: 12,
    backgroundColor: "#ede9fe",
    borderRadius: 10,
    padding: 12,
  },
  trackingLabel: {
    fontSize: 12,
    color: "#7c3aed",
    fontWeight: "600",
    marginBottom: 4,
  },
  trackingNumber: {
    fontWeight: "800",
    color: "#4c1d95",
    fontSize: 15,
  },
  notesBox: {
    backgroundColor: "#fef9c3",
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  notesText: {
    fontStyle: "italic",
    color: "#78350f",
    fontSize: 14,
    lineHeight: 20,
  },
  actionBtn: {
    backgroundColor: "#dcfce7",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  actionBtnText: {
    fontWeight: "700",
    color: "#16a34a",
    fontSize: 15,
  },
  trackingInputBox: {
    marginBottom: 8,
  },
  trackingInput: {
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#111827",
    marginBottom: 8,
  },
  trackingBtns: {
    flexDirection: "row",
    gap: 10,
  },
  trackingConfirmBtn: {
    flex: 1,
    backgroundColor: PURPLE,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  trackingConfirmText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
  trackingCancelBtn: {
    padding: 12,
    alignItems: "center",
  },
  trackingCancelText: {
    color: "#9ca3af",
    fontSize: 14,
  },
  completedCard: {
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  cancelledCard: {
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  completedEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  completedTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#16a34a",
  },
  completedDate: {
    fontSize: 13,
    color: "#9ca3af",
    marginTop: 4,
  },
});
