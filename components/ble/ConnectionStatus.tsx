/**
 * BLE Connection Status Component
 * Displays current connection state and device info
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ConnectionStatus as Status } from '@/types/meshcore';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

interface ConnectionStatusProps {
  status: Status;
  deviceName?: string | null;
  error?: string | null;
  onDisconnect?: () => void;
}

export function ConnectionStatus({ status, deviceName, error, onDisconnect }: ConnectionStatusProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return '#4CAF50'; // Green
      case 'connecting':
        return '#FF9800'; // Orange
      case 'error':
        return '#F44336'; // Red
      default:
        return '#9E9E9E'; // Gray
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return `Connected${deviceName ? `: ${deviceName}` : ''}`;
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Error';
      default:
        return 'Disconnected';
    }
  };

  const statusColor = getStatusColor();
  const borderColor = useThemeColor({}, 'icon');

  return (
    <ThemedView style={[styles.container, { borderColor }]}>
      <View style={styles.statusRow}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <ThemedText type="defaultSemiBold" style={styles.statusText}>
          {getStatusText()}
        </ThemedText>
      </View>

      {error && (
        <ThemedText style={styles.errorText}>{error}</ThemedText>
      )}

      {status === 'connected' && onDisconnect && (
        <TouchableOpacity style={styles.disconnectButton} onPress={onDisconnect}>
          <Text style={styles.disconnectButtonText}>Disconnect</Text>
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 16,
  },
  errorText: {
    marginTop: 10,
    fontSize: 14,
    opacity: 0.7,
  },
  disconnectButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#F44336',
    borderRadius: 6,
    alignItems: 'center',
  },
  disconnectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
