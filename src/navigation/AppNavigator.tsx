import React from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
import { useAuth } from "../context/AuthContext";

import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import DashboardScreen from "../screens/dashboard/DashboardScreen";
import ProductsScreen from "../screens/products/ProductsScreen";
import AddProductScreen from "../screens/products/AddProductScreen";
import EditProductScreen from "../screens/products/EditProductScreen";
import OrdersScreen from "../screens/orders/OrdersScreen";
import OrderDetailScreen from "../screens/orders/OrderDetailScreen";
import StoreScreen from "../screens/store/StoreScreen";
import InventoryScreen from "../screens/inventory/InventoryScreen";
import AnalyticsScreen from "../screens/analytics/AnalyticsScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function tabIcon(name: string, focused: boolean) {
  const map: Record<string,string> = {
    Dashboard:"D", Products:"P", Orders:"O",
    Store:"S", Inventory:"I", Analytics:"A"
  };
  return (
    <Text style={{fontSize:18, color: focused ? "#7c3aed" : "#9ca3af"}}>
      {map[name] ?? "•"}
    </Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={({route}) => ({
      headerShown: false,
      tabBarIcon: ({focused}) => tabIcon(route.name, focused),
      tabBarActiveTintColor: "#7c3aed",
      tabBarInactiveTintColor: "#9ca3af",
    })}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Products" component={ProductsScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Store" component={StoreScreen} />
      <Tab.Screen name="Inventory" component={InventoryScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{flex:1, justifyContent:"center", alignItems:"center"}}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="AddProduct" component={AddProductScreen} />
            <Stack.Screen name="EditProduct" component={EditProductScreen} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}