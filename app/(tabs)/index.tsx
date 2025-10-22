/**
 * Home Screen - BLE Device Connection
 * Scan for and connect to MeshCore devices
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { DeviceScanner } from '@/components/ble/DeviceScanner';
import { ConnectionStatus } from '@/components/ble/ConnectionStatus';
import { useBLE } from '@/hooks/useBLE';

export default function HomeScreen() {
  const {
    connectionStatus,
    scannedDevices,
    isScanning,
    error,
    startScan,
    stopScan,
    connect,
    disconnect,
    fetchContacts,
    getDeviceInfo,
  } = useBLE();

  // Fetch contacts after successful connection
  useEffect(() => {
    if (connectionStatus === 'connected') {
      fetchContacts().catch((err) => {
        console.error('Failed to fetch contacts:', err);
      });
    }
  }, [connectionStatus, fetchContacts]);

  const handleConnect = async (deviceId: string) => {
    stopScan();
    const success = await connect(deviceId);

    if (success) {
      Alert.alert(
        'Connected',
        'Successfully connected to MeshCore device. Fetching contacts...'
      );
    } else {
      Alert.alert('Connection Failed', 'Could not connect to device. Please try again.');
    }
  };

  const handleDisconnect = async () => {
    Alert.alert(
      'Disconnect Device',
      'Are you sure you want to disconnect from the MeshCore device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: disconnect,
        },
      ]
    );
  };

  const deviceInfo = getDeviceInfo();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">MeshCore Mapper</ThemedText>
        <ThemedText style={styles.subtitle}>Signal Coverage Tester</ThemedText>
      </View>

      <ConnectionStatus
        status={connectionStatus}
        deviceName={deviceInfo?.name}
        error={error}
        onDisconnect={connectionStatus === 'connected' ? handleDisconnect : undefined}
      />

      {connectionStatus !== 'connected' && (
        <DeviceScanner
          devices={scannedDevices}
          isScanning={isScanning}
          onScan={startScan}
          onConnect={handleConnect}
        />
      )}

      {connectionStatus === 'connected' && (
        <ThemedView style={styles.connectedView}>
          <ThemedText type="subtitle" style={styles.connectedTitle}>
            Device Connected
          </ThemedText>
          <ThemedText style={styles.connectedText}>
            Go to the Collection tab to start mapping signal strength.
          </ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
    paddingTop: 40,
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 5,
  },
  connectedView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  connectedTitle: {
    marginBottom: 15,
  },
  connectedText: {
    textAlign: 'center',
    opacity: 0.7,
  },
});
