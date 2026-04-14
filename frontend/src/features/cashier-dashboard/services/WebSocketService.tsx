import { useEffect, useState, useCallback, useRef } from 'react';
import SockJS from 'sockjs-client';
import { CompatClient } from '@stomp/stompjs';
import { toast } from 'react-toastify';
import { getWebSocketUrl } from '../../../utils/apiBaseUrls';
import { useUserContext } from '../../../context/UserContext';
import { supportsLegacyRealtime } from '../../../utils/legacySession';

export interface PrescriptionData {
  prescriptionId: string;
  userId: string;
  userName: string | null;
  imageUrl: string;
  notes: string;
  eventType: string;
  status: string;
  priority: string | null;
  uploadTimestamp: string | null;
  notificationTimestamp: string | null;
}

const useWebSocketService = () => {
  const [prescriptions, setPrescriptions] = useState<PrescriptionData[]>([]);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectionFailed, setConnectionFailed] = useState(false);
  const stompClientRef = useRef<CompatClient | null>(null);
  const hasShownToastRef = useRef(false);
  const { user } = useUserContext();
  const realtimeEnabled = supportsLegacyRealtime(user);

  const connectWebSocket = useCallback(() => {
    if (!realtimeEnabled) {
      setConnected(false);
      setConnecting(false);
      setConnectionFailed(false);
      return;
    }

    if (stompClientRef.current?.connected) {
      return;
    }

    setConnecting(true);
    setConnectionFailed(false);
    hasShownToastRef.current = false;
    
    // Create WebSocket connection
    const wsURL = getWebSocketUrl();
    const client = new CompatClient(() => new SockJS(wsURL) as any);

    // Disable debug logging
    client.debug = () => {};
    client.reconnectDelay = 5000;

    // Connect to WebSocket
    client.connect(
      {},
      () => {
        setConnected(true);
        setConnecting(false);
        setConnectionFailed(false);
        
        // Show success toast only once
        if (!hasShownToastRef.current) {
          toast.success('Connected to prescription service', {
            position: 'top-right',
            autoClose: 3000,
          });
          hasShownToastRef.current = true;
        }

        // Subscribe to prescription topic
        client.subscribe('/topic/prescriptions', (message) => {
          const prescription = JSON.parse(message.body);

          // Add new prescription to the list
          setPrescriptions((prev) => [prescription, ...prev]);
          
          // Show notification toast
          toast.info('New prescription received!', {
            position: 'top-right',
            autoClose: 5000,
          });
        });
      },
      () => {
        setConnected(false);
        setConnecting(false);
        setConnectionFailed(true);
        
        // Show error toast
        toast.error('Failed to connect to prescription service', {
          position: 'top-right',
          autoClose: 5000,
        });
      }
    );

    stompClientRef.current = client;
  }, [realtimeEnabled]);

  const disconnectWebSocket = useCallback(() => {
    if (stompClientRef.current) {
      stompClientRef.current.disconnect(() => {
        setConnected(false);
        setConnectionFailed(false);
        stompClientRef.current = null;
        hasShownToastRef.current = false;
      });
    } else {
      setConnected(false);
      setConnectionFailed(false);
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (realtimeEnabled) {
      connectWebSocket();
    } else {
      disconnectWebSocket();
    }

    // Cleanup on unmount - disconnect when app closes
    return () => {
      if (stompClientRef.current?.connected) {
        disconnectWebSocket();
      }
    };
  }, [connectWebSocket, disconnectWebSocket, realtimeEnabled]);

  const clearPrescriptions = useCallback(() => {
    setPrescriptions([]);
  }, []);

  const removePrescription = useCallback((prescriptionId: string) => {
    setPrescriptions((prev) =>
      prev.filter((p) => p.prescriptionId !== prescriptionId)
    );
  }, []);

  return {
    prescriptions,
    connected,
    connecting,
    connectionFailed,
    connectWebSocket,
    disconnectWebSocket,
    clearPrescriptions,
    removePrescription,
  };
};

export default useWebSocketService;
