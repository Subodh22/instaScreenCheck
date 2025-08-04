// Push Notification Service
export interface PushNotificationData {
  title: string;
  body: string;
  url?: string;
  type?: string;
  icon?: string;
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  // Check if push notifications are supported
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Check if notifications are permitted
  async isPermissionGranted(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission === 'denied') {
      return false;
    }
    
    // Request permission
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Register service worker for push notifications
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    try {
      if (!this.isSupported()) {
        console.log('Push notifications not supported');
        return null;
      }

      // Register the service worker
      this.registration = await navigator.serviceWorker.register('/sw-push.js');
      console.log('Service Worker registered for push notifications:', this.registration);
      
      return this.registration;
    } catch (error) {
      console.error('Failed to register service worker:', error);
      return null;
    }
  }

  // Subscribe to push notifications
  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    try {
      // Check permission first
      const hasPermission = await this.isPermissionGranted();
      if (!hasPermission) {
        console.log('Notification permission not granted');
        return null;
      }

      // Register service worker if not already registered
      if (!this.registration) {
        this.registration = await this.registerServiceWorker();
        if (!this.registration) {
          return null;
        }
      }

      // Get existing subscription or create new one
      this.subscription = await this.registration.pushManager.getSubscription();
      
      if (!this.subscription) {
        // Create new subscription
        this.subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '')
        });
      }

      console.log('Push subscription created:', this.subscription);
      return this.subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribeFromPushNotifications(): Promise<boolean> {
    try {
      if (this.subscription) {
        await this.subscription.unsubscribe();
        this.subscription = null;
        console.log('Unsubscribed from push notifications');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  // Get current subscription
  getSubscription(): PushSubscription | null {
    return this.subscription;
  }

  // Send a test notification
  async sendTestNotification(): Promise<boolean> {
    try {
      if (!this.subscription) {
        console.log('No push subscription found');
        return false;
      }

      const testData: PushNotificationData = {
        title: 'Test Notification',
        body: 'This is a test push notification from Screen Time Tracker!',
        url: '/',
        type: 'test'
      };

      const response = await fetch('/api/notifications/send-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: this.subscription,
          data: testData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send test notification');
      }

      console.log('Test notification sent successfully');
      return true;
    } catch (error) {
      console.error('Failed to send test notification:', error);
      return false;
    }
  }

  // Convert VAPID public key to Uint8Array
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Get subscription info for server
  getSubscriptionInfo() {
    if (!this.subscription) {
      return null;
    }

    return {
      endpoint: this.subscription.endpoint,
      keys: {
        p256dh: btoa(String.fromCharCode.apply(null, 
          new Uint8Array(this.subscription.getKey('p256dh') || [])
        )),
        auth: btoa(String.fromCharCode.apply(null, 
          new Uint8Array(this.subscription.getKey('auth') || [])
        ))
      }
    };
  }
}

// Export singleton instance
export const pushNotificationService = PushNotificationService.getInstance(); 