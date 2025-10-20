import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { AuthGuard } from '../../components/AuthGuard';

export default function TabLayout() {
  console.log('TabLayout rendering...'); // Debug log
  
  return (
    <AuthGuard>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#60a5fa',
          tabBarInactiveTintColor: '#6b7280',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Ventas',
            tabBarIcon: ({ color }) => (
              <Ionicons name="cart" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="admin"
          options={{
            title: 'Admin',
            tabBarIcon: ({ color }) => (
              <Ionicons name="settings" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="test-nav"
          options={{
            title: 'Test',
            tabBarIcon: ({ color }) => (
              <Ionicons name="flask" size={24} color={color} />
            ),
          }}
        />
      </Tabs>
    </AuthGuard>
  );
}