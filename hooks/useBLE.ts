/**
 * React Hook for MeshCore BLE Connection Management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { MeshCoreConnection } from '@/services/ble/MeshCoreConnection';
import { MeshCoreContact, ScannedDevice, ConnectionStatus, TraceResponse } from '@/types/meshcore';

export function useBLE() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [scannedDevices, setScannedDevices] = useState<ScannedDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [contacts, setContacts] = useState<MeshCoreContact[]>([]);
  const [selectedRepeater, setSelectedRepeater] = useState<MeshCoreContact | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connectionRef = useRef<MeshCoreConnection | null>(null);

  // Initialize BLE connection manager
  useEffect(() => {
    const connection = new MeshCoreConnection();
    connectionRef.current = connection;

    // Initialize
    connection.initialize().then((success) => {
      if (!success) {
        setError('Bluetooth not available');
        setConnectionStatus('error');
      }
    });

    // Cleanup on unmount
    return () => {
      connection.destroy();
      connectionRef.current = null;
    };
  }, []);

  /**
   * Start scanning for MeshCore devices
   */
  const startScan = useCallback(async () => {
    if (!connectionRef.current) {
      setError('BLE not initialized');
      return;
    }

    setIsScanning(true);
    setScannedDevices([]);
    setError(null);

    try {
      await connectionRef.current.scanForDevices(
        (device) => {
          setScannedDevices((prev) => {
            // Avoid duplicates
            if (prev.some((d) => d.id === device.id)) {
              return prev;
            }
            return [...prev, device];
          });
        }
      );
    } catch (error) {
      console.error('Scan error:', error);
      setError(error instanceof Error ? error.message : 'Scan failed');
    } finally {
      setIsScanning(false);
    }
  }, []);

  /**
   * Stop scanning
   */
  const stopScan = useCallback(() => {
    if (!connectionRef.current) return;
    connectionRef.current.stopScan();
    setIsScanning(false);
  }, []);

  /**
   * Connect to a device
   */
  const connect = useCallback(async (deviceId: string) => {
    if (!connectionRef.current) {
      setError('BLE not initialized');
      return false;
    }

    setConnectionStatus('connecting');
    setError(null);

    try {
      const success = await connectionRef.current.connect(deviceId);

      if (success) {
        setConnectionStatus('connected');
        return true;
      } else {
        setConnectionStatus('disconnected');
        setError('Failed to connect');
        return false;
      }
    } catch (error) {
      console.error('Connection error:', error);
      setConnectionStatus('error');
      setError(error instanceof Error ? error.message : 'Connection failed');
      return false;
    }
  }, []);

  /**
   * Disconnect from device
   */
  const disconnect = useCallback(async () => {
    if (!connectionRef.current) return;

    try {
      await connectionRef.current.disconnect();
      setConnectionStatus('disconnected');
      setContacts([]);
      setSelectedRepeater(null);
    } catch (error) {
      console.error('Disconnect error:', error);
      setError(error instanceof Error ? error.message : 'Disconnect failed');
    }
  }, []);

  /**
   * Fetch contacts from connected device
   */
  const fetchContacts = useCallback(async () => {
    if (!connectionRef.current || connectionStatus !== 'connected') {
      setError('Not connected to device');
      return;
    }

    setError(null);

    try {
      const contactList = await connectionRef.current.getContacts();
      setContacts(contactList);

      // Auto-select first contact if none selected
      if (contactList.length > 0 && !selectedRepeater) {
        setSelectedRepeater(contactList[0]);
      }
    } catch (error) {
      console.error('Fetch contacts error:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch contacts');
    }
  }, [connectionStatus, selectedRepeater]);

  /**
   * Perform trace to selected repeater
   */
  const performTrace = useCallback(async (): Promise<TraceResponse | null> => {
    if (!connectionRef.current || connectionStatus !== 'connected') {
      setError('Not connected to device');
      return null;
    }

    if (!selectedRepeater) {
      setError('No repeater selected');
      return null;
    }

    setError(null);

    try {
      const response = await connectionRef.current.performTrace(selectedRepeater.pubkey);
      return response;
    } catch (error) {
      console.error('Trace error:', error);
      setError(error instanceof Error ? error.message : 'Trace failed');
      return null;
    }
  }, [connectionStatus, selectedRepeater]);

  /**
   * Get connected device info
   */
  const getDeviceInfo = useCallback(() => {
    if (!connectionRef.current) return null;
    return connectionRef.current.getDeviceInfo();
  }, []);

  return {
    // State
    connectionStatus,
    scannedDevices,
    isScanning,
    contacts,
    selectedRepeater,
    error,

    // Actions
    startScan,
    stopScan,
    connect,
    disconnect,
    fetchContacts,
    performTrace,
    setSelectedRepeater,
    getDeviceInfo,
  };
}
