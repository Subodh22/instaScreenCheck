# Push Notifications Guide

This guide explains how push notifications work in PWA apps across different platforms and how to set them up.

## 📱 Platform Support

### **Chrome (Android/Desktop)**
- ✅ **Full Support**: Excellent PWA push notification support
- ✅ **Background Notifications**: Work even when app is closed
- ✅ **Service Worker**: Handles notifications properly
- ✅ **Web Push API**: Fully supported
- ✅ **Installation**: Can be installed as a native app

### **Safari (iOS)**
- ❌ **Limited Support**: iOS Safari has very limited PWA push notification support
- ⚠️ **Web Push API**: Partially supported in iOS 16.4+ but with restrictions
- ❌ **Background Notifications**: Don't work reliably on iOS
- ✅ **In-App Notifications**: Work when the app is open
- ✅ **Installation**: Can be added to home screen

### **Firefox**
- ✅ **Good Support**: Firefox has good PWA push notification support
- ✅ **Background Notifications**: Work when app is closed
- ✅ **Service Worker**: Handles notifications properly

### **Edge**
- ✅ **Full Support**: Excellent PWA push notification support
- ✅ **Background Notifications**: Work even when app is closed

## 🛠️ Setup Requirements

### 1. Environment Variables

Add these to your `.env.local`:

```env
# VAPID Keys for push notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_vapid_key_here
VAPID_PRIVATE_KEY=your_private_vapid_key_here
```

### 2. Generate VAPID Keys

You can generate VAPID keys using the web-push library:

```bash
npx web-push generate-vapid-keys
```

Or use an online generator:
- [VAPID Key Generator](https://web-push-codelab.glitch.me/)

### 3. Database Schema

Add this column to your `users` table:

```sql
ALTER TABLE users ADD COLUMN push_subscription JSONB;
```

## 🔧 Implementation Details

### Service Worker (`/public/sw-push.js`)
- Handles incoming push notifications
- Manages notification clicks
- Provides background sync capabilities

### Push Notification Service (`/src/lib/pushNotifications.ts`)
- Manages subscription lifecycle
- Handles permission requests
- Provides testing capabilities

### API Endpoint (`/api/notifications/send-push`)
- Sends push notifications using web-push library
- Handles subscription validation
- Manages error responses

## 📋 Testing Push Notifications

### 1. Manual Testing
```bash
# Test the push notification endpoint
curl -X POST https://your-app.vercel.app/api/notifications/send-push \
  -H "Content-Type: application/json" \
  -d '{
    "subscription": {
      "endpoint": "your_subscription_endpoint",
      "keys": {
        "p256dh": "your_p256dh_key",
        "auth": "your_auth_key"
      }
    },
    "data": {
      "title": "Test Notification",
      "body": "This is a test push notification!",
      "url": "/",
      "type": "test"
    }
  }'
```

### 2. In-App Testing
- Use the "Test Push Notification" button in NotificationSettings
- Check browser console for subscription details
- Verify notification appears on device

## 🚀 Deployment Checklist

### Before Deployment
- [ ] Generate VAPID keys
- [ ] Add environment variables to Vercel
- [ ] Update database schema
- [ ] Test on Chrome (Android/Desktop)
- [ ] Test on Safari (iOS) - limited functionality
- [ ] Test on Firefox

### After Deployment
- [ ] Verify service worker registration
- [ ] Test push notification subscription
- [ ] Monitor notification delivery rates
- [ ] Check error logs

## 📊 Platform-Specific Considerations

### Chrome (Android/Desktop)
**Best Experience:**
- Full background notification support
- Native app-like experience
- Reliable delivery

**Setup:**
- No additional setup required
- Works out of the box

### Safari (iOS)
**Limitations:**
- No background notifications
- Requires user interaction
- Limited to in-app notifications

**Workarounds:**
- Use in-app notifications when app is open
- Implement fallback to email notifications
- Consider native iOS app for full functionality

### Firefox
**Good Experience:**
- Reliable push notifications
- Good service worker support

**Setup:**
- No additional setup required
- Works similar to Chrome

## 🔍 Troubleshooting

### Common Issues

1. **"Push notifications not supported"**
   - Check if browser supports Service Workers and Push API
   - Verify HTTPS is enabled (required for service workers)

2. **"Notification permission denied"**
   - User needs to manually enable notifications in browser settings
   - Guide users to browser notification settings

3. **"Subscription has expired"**
   - Push subscriptions can expire
   - Implement subscription refresh logic

4. **"VAPID keys not configured"**
   - Ensure environment variables are set
   - Verify keys are correctly formatted

### Debug Steps

1. **Check Browser Support:**
   ```javascript
   console.log('Service Worker:', 'serviceWorker' in navigator);
   console.log('Push Manager:', 'PushManager' in window);
   console.log('Notifications:', 'Notification' in window);
   ```

2. **Check Permission Status:**
   ```javascript
   console.log('Permission:', Notification.permission);
   ```

3. **Check Service Worker Registration:**
   ```javascript
   navigator.serviceWorker.getRegistrations().then(registrations => {
     console.log('Service Workers:', registrations);
   });
   ```

4. **Check Push Subscription:**
   ```javascript
   navigator.serviceWorker.ready.then(registration => {
     registration.pushManager.getSubscription().then(subscription => {
       console.log('Push Subscription:', subscription);
     });
   });
   ```

## 📈 Best Practices

### User Experience
- Request notification permission at appropriate times
- Provide clear explanation of notification benefits
- Allow users to easily disable notifications
- Test notifications on multiple devices

### Technical
- Implement subscription refresh logic
- Handle expired subscriptions gracefully
- Monitor notification delivery rates
- Provide fallback notification methods

### Security
- Use HTTPS for all push notification traffic
- Validate VAPID keys properly
- Implement rate limiting for notification endpoints
- Secure subscription data in database

## 🔄 Alternative Solutions

### For iOS Users
Since iOS has limited PWA push notification support, consider:

1. **Email Notifications**
   - Send daily reminder emails
   - More reliable than push notifications on iOS

2. **SMS Notifications**
   - Use services like Twilio
   - Higher delivery rates

3. **Native iOS App**
   - Full push notification support
   - Better user experience

4. **In-App Notifications**
   - Show notifications when app is open
   - Works reliably on all platforms

## 📚 Resources

- [Web Push Protocol](https://tools.ietf.org/html/rfc8030)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [VAPID Specification](https://tools.ietf.org/html/rfc8292)
- [PWA Push Notifications](https://web.dev/push-notifications/) 