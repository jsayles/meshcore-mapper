/**
 * MeshCore BLE Connection Manager
 * Handles device scanning, connection, and communication
 */

import { BleManager, Device, Subscription } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import { MESHCORE_BLE, TIMEOUTS, PROTOCOL } from '@/constants/meshcore';
import { MeshCoreContact, TraceResponse, ScannedDevice } from '@/types/meshcore';
import * as Protocol from './MeshCoreProtocol';

export class MeshCoreConnection {
  private bleManager: BleManager;
  private device: Device | null = null;
  private notificationSubscription: Subscription | null = null;
  private messageHandlers: Map<string, (data: Buffer) => void> = new Map();
  private scanTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.bleManager = new BleManager();
  }

  /**
   * Initialize BLE manager and check permissions
   */
  async initialize(): Promise<boolean> {
    try {
      const state = await this.bleManager.state();
      console.log('BLE State:', state);

      if (state !== 'PoweredOn') {
        console.warn('Bluetooth is not powered on');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize BLE:', error);
      return false;
    }
  }

  /**
   * Scan for MeshCore devices
   */
  async scanForDevices(
    onDeviceFound: (device: ScannedDevice) => void,
    durationMs: number = TIMEOUTS.SCAN
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const foundDevices = new Set<string>();

      // Clear any existing scan timeout
      if (this.scanTimeout) {
        clearTimeout(this.scanTimeout);
      }

      console.log('Starting BLE scan for MeshCore devices...');

      this.bleManager.startDeviceScan(
        null, // Scan all services
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            console.error('Scan error:', error);
            this.bleManager.stopDeviceScan();
            reject(error);
            return;
          }

          if (device && device.name?.startsWith(MESHCORE_BLE.DEVICE_NAME_PREFIX)) {
            // Only report each device once
            if (!foundDevices.has(device.id)) {
              foundDevices.add(device.id);
              console.log('Found MeshCore device:', device.name, device.id);

              onDeviceFound({
                id: device.id,
                name: device.name,
                rssi: device.rssi ?? undefined,
              });
            }
          }
        }
      );

      // Stop scan after timeout
      this.scanTimeout = setTimeout(() => {
        console.log('Scan timeout reached, stopping scan');
        this.bleManager.stopDeviceScan();
        resolve();
      }, durationMs);
    });
  }

  /**
   * Stop scanning for devices
   */
  stopScan(): void {
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
    this.bleManager.stopDeviceScan();
  }

  /**
   * Connect to a MeshCore device by ID
   */
  async connect(deviceId: string): Promise<boolean> {
    try {
      console.log('Connecting to device:', deviceId);

      // Connect to device
      this.device = await this.bleManager.connectToDevice(deviceId, {
        timeout: TIMEOUTS.CONNECT,
      });

      console.log('Connected, discovering services...');

      // Discover services and characteristics
      await this.device.discoverAllServicesAndCharacteristics();

      console.log('Services discovered, setting up notifications...');

      // Subscribe to TX characteristic (device -> app)
      this.notificationSubscription = this.device.monitorCharacteristicForService(
        MESHCORE_BLE.SERVICE_UUID,
        MESHCORE_BLE.TX_CHARACTERISTIC_UUID,
        (error, characteristic) => {
          if (error) {
            console.error('Notification error:', error);
            return;
          }

          if (characteristic?.value) {
            const data = Buffer.from(characteristic.value, 'base64');
            this.handleIncomingData(data);
          }
        }
      );

      console.log('Connected successfully');
      return true;
    } catch (error) {
      console.error('Connection failed:', error);
      this.device = null;
      return false;
    }
  }

  /**
   * Disconnect from current device
   */
  async disconnect(): Promise<void> {
    try {
      // Unsubscribe from notifications
      if (this.notificationSubscription) {
        this.notificationSubscription.remove();
        this.notificationSubscription = null;
      }

      // Disconnect device
      if (this.device) {
        await this.device.cancelConnection();
        this.device = null;
      }

      // Clear message handlers
      this.messageHandlers.clear();

      console.log('Disconnected');
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.device !== null;
  }

  /**
   * Get connected device info
   */
  getDeviceInfo(): { id: string; name: string | null } | null {
    if (!this.device) return null;
    return {
      id: this.device.id,
      name: this.device.name,
    };
  }

  /**
   * Send data to device (write to RX characteristic)
   */
  private async writeData(data: Buffer): Promise<void> {
    if (!this.device) {
      throw new Error('Not connected to device');
    }

    const base64Data = data.toString('base64');

    await this.device.writeCharacteristicWithResponseForService(
      MESHCORE_BLE.SERVICE_UUID,
      MESHCORE_BLE.RX_CHARACTERISTIC_UUID,
      base64Data
    );
  }

  /**
   * Handle incoming data from device
   */
  private handleIncomingData(data: Buffer): void {
    console.log('Received data:', data.length, 'bytes');

    // Call all registered handlers
    this.messageHandlers.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error('Message handler error:', error);
      }
    });
  }

  /**
   * Register a message handler
   */
  private registerHandler(id: string, handler: (data: Buffer) => void): void {
    this.messageHandlers.set(id, handler);
  }

  /**
   * Unregister a message handler
   */
  private unregisterHandler(id: string): void {
    this.messageHandlers.delete(id);
  }

  /**
   * Fetch contacts from device
   */
  async getContacts(): Promise<MeshCoreContact[]> {
    return new Promise(async (resolve, reject) => {
      const contacts: MeshCoreContact[] = [];
      const handlerId = 'get-contacts';
      let contactsStarted = false;

      // Timeout handler
      const timeout = setTimeout(() => {
        this.unregisterHandler(handlerId);
        reject(new Error('Timeout waiting for contacts'));
      }, TIMEOUTS.COMMAND);

      // Register message handler
      this.registerHandler(handlerId, (data: Buffer) => {
        if (Protocol.isContactStart(data)) {
          console.log('Contact list started');
          contactsStarted = true;
        } else if (Protocol.isContactEnd(data)) {
          console.log('Contact list complete:', contacts.length, 'contacts');
          clearTimeout(timeout);
          this.unregisterHandler(handlerId);
          resolve(contacts);
        } else if (contactsStarted) {
          const contact = Protocol.parseContactPacket(data);
          if (contact) {
            console.log('Received contact:', contact.prefix, contact.name);
            contacts.push(contact);
          }
        }
      });

      // Send get contacts request
      try {
        const request = Protocol.buildGetContactsRequest();
        await this.writeData(request);
      } catch (error) {
        clearTimeout(timeout);
        this.unregisterHandler(handlerId);
        reject(error);
      }
    });
  }

  /**
   * Perform trace to target repeater
   */
  async performTrace(targetPubkey: string): Promise<TraceResponse> {
    return new Promise(async (resolve, reject) => {
      const handlerId = 'trace';

      // Timeout handler
      const timeout = setTimeout(() => {
        this.unregisterHandler(handlerId);
        reject(new Error('Timeout waiting for trace response'));
      }, TIMEOUTS.TRACE);

      // Register message handler
      this.registerHandler(handlerId, (data: Buffer) => {
        const response = Protocol.parseTraceResponse(data);

        if (response) {
          console.log('Trace response:', response);
          clearTimeout(timeout);
          this.unregisterHandler(handlerId);

          // Verify hop count
          if (response.hopCount > PROTOCOL.MAX_HOPS) {
            reject(new Error(`Not a direct connection (${response.hopCount} hops)`));
            return;
          }

          resolve(response);
        } else if (Protocol.isError(data)) {
          clearTimeout(timeout);
          this.unregisterHandler(handlerId);
          reject(new Error('Device returned error for trace request'));
        }
      });

      // Send trace request
      try {
        const request = Protocol.buildTraceRequest(targetPubkey);
        await this.writeData(request);
      } catch (error) {
        clearTimeout(timeout);
        this.unregisterHandler(handlerId);
        reject(error);
      }
    });
  }

  /**
   * Cleanup and destroy
   */
  destroy(): void {
    this.stopScan();
    this.disconnect();
    this.bleManager.destroy();
  }
}
