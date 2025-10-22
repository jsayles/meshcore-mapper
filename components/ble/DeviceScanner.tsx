/**
 * BLE Device Scanner Component
 * Displays list of discovered MeshCore devices
 */

import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { ScannedDevice } from '@/types/meshcore';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

interface DeviceScannerProps {
  devices: ScannedDevice[];
  isScanning: boolean;
  onScan: () => void;
  onConnect: (deviceId: string) => void;
}

export function DeviceScanner({ devices, isScanning, onScan, onConnect }: DeviceScannerProps) {
  const borderColor = useThemeColor({}, 'icon');
  const buttonBg = useThemeColor({}, 'tint');

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        MeshCore Devices
      </ThemedText>

      <TouchableOpacity
        style={[styles.scanButton, { backgroundColor: buttonBg }]}
        onPress={onScan}
        disabled={isScanning}
      >
        {isScanning ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.scanButtonText}>
            {devices.length > 0 ? 'Scan Again' : 'Start Scan'}
          </Text>
        )}
      </TouchableOpacity>

      {isScanning && (
        <ThemedText style={styles.scanningText}>Scanning for devices...</ThemedText>
      )}

      {devices.length === 0 && !isScanning && (
        <ThemedView style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>
            No devices found. Press "Start Scan" to search for MeshCore devices.
          </ThemedText>
        </ThemedView>
      )}

      {devices.length > 0 && (
        <FlatList
          data={devices}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.deviceItem, { borderColor }]}
              onPress={() => onConnect(item.id)}
            >
              <View style={styles.deviceInfo}>
                <ThemedText type="defaultSemiBold">{item.name || 'Unknown Device'}</ThemedText>
                <ThemedText style={styles.deviceId}>{item.id}</ThemedText>
                {item.rssi !== undefined && (
                  <ThemedText style={styles.rssi}>RSSI: {item.rssi} dBm</ThemedText>
                )}
              </View>
            </TouchableOpacity>
          )}
          style={styles.deviceList}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    marginBottom: 20,
  },
  scanButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scanningText: {
    textAlign: 'center',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    textAlign: 'center',
    opacity: 0.6,
  },
  deviceList: {
    flex: 1,
  },
  deviceItem: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
  },
  deviceInfo: {
    gap: 5,
  },
  deviceId: {
    fontSize: 12,
    opacity: 0.6,
  },
  rssi: {
    fontSize: 12,
    opacity: 0.7,
  },
});
