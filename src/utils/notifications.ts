import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log("Push notifications only work on real devices");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    Alert.alert("Notifications Disabled", "Enable notifications to get new order alerts!");
    return null;
  }

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? "";
    const token = await Notifications.getExpoPushTokenAsync({ projectId });

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("orders", {
        name: "New Orders",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#7c3aed",
        sound: "default",
      });
    }

    await AsyncStorage.setItem("push_token", token.data);
    try {
      await api.post("/notifications/register-device", { pushToken: token.data, platform: Platform.OS });
    } catch { console.log("Could not register push token"); }

    return token.data;
  } catch (e) {
    console.log("Could not get push token:", e);
    return null;
  }
}

export function sendLocalNotification(title: string, body: string, data?: Record<string, unknown>) {
  Notifications.scheduleNotificationAsync({
    content: { title, body, data: data ?? {}, sound: "default" },
    trigger: null,
  });
}

export function startOrderPolling(callback: (count: number) => void) {
  let lastOrderCount = 0;
  const poll = async () => {
    try {
      const res = await api.get("/orders?status=Pending");
      const count = (res.data.data?.orders ?? []).length;
      if (count > lastOrderCount && lastOrderCount > 0) {
        const n = count - lastOrderCount;
        sendLocalNotification("New Order!", `You have ${n} new order${n > 1 ? "s" : ""} waiting!`, { screen: "Orders" });
      }
      lastOrderCount = count;
      callback(count);
    } catch {}
  };
  poll();
  return setInterval(poll, 60000);
}