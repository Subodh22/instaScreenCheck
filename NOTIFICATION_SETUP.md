# Notification System Setup

This document explains how to set up the notification system for screen time upload reminders.

## Overview

The notification system sends daily reminders at 10 PM to users who haven't uploaded their screen time screenshot for the day.

## Components

### 1. API Endpoints

- `/api/notifications/send-reminder` - Main endpoint for sending reminders (requires authentication)
- `/api/notifications/test-reminder` - Test endpoint for manual triggering

### 2. Database Schema

Add these columns to your `users` table:

```sql
ALTER TABLE users ADD COLUMN notification_preferences JSONB DEFAULT '{
  "daily_reminders": true,
  "weekly_summary": true,
  "competition_updates": true,
  "reminder_time": "22:00"
}';
```

Optional: Create a notification history table:

```sql
CREATE TABLE notification_history (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered BOOLEAN DEFAULT FALSE
);
```

### 3. Environment Variables

Add to your `.env.local`:

```env
CRON_SECRET_KEY=your-secret-key-here
```

## Setting Up Automated Reminders

### Option 1: Vercel Cron Jobs (Recommended)

1. Create a `vercel.json` file in your project root:

```json
{
  "crons": [
    {
      "path": "/api/notifications/send-reminder",
      "schedule": "0 22 * * *"
    }
  ]
}
```

2. Add the authorization header to your API call:

```bash
curl -X POST https://your-app.vercel.app/api/notifications/send-reminder \
  -H "Authorization: Bearer your-secret-key-here"
```

### Option 2: External Cron Service

Use services like:
- [Cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- [SetCronJob](https://www.setcronjob.com)

Set up a cron job to call:
```
POST https://your-app.vercel.app/api/notifications/send-reminder
Headers: Authorization: Bearer your-secret-key-here
```

### Option 3: GitHub Actions

Create `.github/workflows/notifications.yml`:

```yaml
name: Send Daily Reminders

on:
  schedule:
    - cron: '0 22 * * *'  # 10 PM UTC daily

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Send reminders
        run: |
          curl -X POST https://your-app.vercel.app/api/notifications/send-reminder \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET_KEY }}"
```

## Testing

1. **Manual Test**: Use the test endpoint
   ```bash
   curl -X POST https://your-app.vercel.app/api/notifications/test-reminder
   ```

2. **Check Logs**: Monitor your application logs for notification messages

3. **Database Check**: Verify notification history is being recorded

## Integration with Real Notification Services

The current implementation logs notifications. To send real notifications, integrate with:

### Firebase Cloud Messaging (FCM)
```javascript
// In sendNotification function
import { getMessaging } from 'firebase/messaging';

const messaging = getMessaging();
await send(messaging, {
  token: userFCMToken,
  notification: {
    title: 'Screen Time Reminder',
    body: message
  }
});
```

### Email Notifications
```javascript
// Using a service like SendGrid, Mailgun, etc.
import sgMail from '@sendgrid/mail';

await sgMail.send({
  to: user.email,
  from: 'noreply@yourapp.com',
  subject: 'Screen Time Upload Reminder',
  text: message
});
```

### Push Notifications
```javascript
// Using a service like OneSignal, Pusher, etc.
import OneSignal from 'onesignal-node';

const client = new OneSignal.Client('app-id', 'rest-api-key');
await client.createNotification({
  include_player_ids: [userPlayerId],
  contents: { en: message },
  headings: { en: 'Screen Time Reminder' }
});
```

## User Preferences

Users can manage their notification preferences through the `NotificationSettings` component:

- Enable/disable daily reminders
- Set custom reminder time
- Control weekly summaries
- Manage competition updates

## Monitoring

Monitor the notification system by:

1. **Logs**: Check application logs for notification delivery
2. **Database**: Review notification history table
3. **Analytics**: Track notification open rates and user engagement
4. **Error Handling**: Monitor for failed notifications

## Security

- Use environment variables for sensitive keys
- Implement proper authentication for cron endpoints
- Rate limit notification endpoints
- Validate user permissions before sending notifications

## Troubleshooting

### Common Issues

1. **Notifications not sending**: Check cron job configuration and API authentication
2. **Wrong timezone**: Ensure cron jobs use the correct timezone (UTC)
3. **Database errors**: Verify notification_preferences column exists
4. **Permission errors**: Check Supabase RLS policies

### Debug Steps

1. Test the API endpoint manually
2. Check application logs
3. Verify database connectivity
4. Test with a single user first
5. Monitor notification delivery rates 