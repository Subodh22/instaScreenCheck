import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { PushNotificationData } from '../../../../lib/pushNotifications';

// Configure VAPID keys
const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || ''
};

webpush.setVapidDetails(
  'mailto:your-email@example.com', // Replace with your email
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription, data }: { 
      subscription: any; 
      data: PushNotificationData 
    } = body;

    if (!subscription || !data) {
      return NextResponse.json({ error: 'Missing subscription or data' }, { status: 400 });
    }

    // Prepare the notification payload
    const payload = JSON.stringify({
      title: data.title,
      body: data.body,
      url: data.url || '/',
      type: data.type || 'general',
      icon: data.icon || '/icon-192x192.png'
    });

    // Send the push notification
    const result = await webpush.sendNotification(subscription, payload);

    console.log('Push notification sent successfully:', result);

    return NextResponse.json({
      success: true,
      message: 'Push notification sent successfully',
      statusCode: result.statusCode
    });

  } catch (error) {
    console.error('Error sending push notification:', error);
    
    // Handle specific web-push errors
    if (error instanceof Error) {
      if (error.message.includes('410')) {
        return NextResponse.json({ 
          error: 'Subscription has expired or is no longer valid',
          code: 'SUBSCRIPTION_EXPIRED'
        }, { status: 410 });
      }
      
      if (error.message.includes('429')) {
        return NextResponse.json({ 
          error: 'Too many requests',
          code: 'RATE_LIMITED'
        }, { status: 429 });
      }
    }

    return NextResponse.json({ 
      error: 'Failed to send push notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 