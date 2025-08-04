'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Bell, Clock, Settings, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/hooks/useAuth';
import { supabase } from '../lib/supabase';

interface NotificationPreferences {
  daily_reminders: boolean;
  weekly_summary: boolean;
  competition_updates: boolean;
  reminder_time: string;
}

export function NotificationSettings() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    daily_reminders: true,
    weekly_summary: true,
    competition_updates: true,
    reminder_time: '22:00' // 10 PM default
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>('');

  // Load user preferences
  useEffect(() => {
    if (user?.uid) {
      loadPreferences();
    }
  }, [user?.uid]);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('notification_preferences')
        .eq('firebase_uid', user?.uid)
        .single();

      if (error) {
        console.error('Error loading preferences:', error);
      } else if (data?.notification_preferences) {
        setPreferences({
          ...preferences,
          ...data.notification_preferences
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user?.uid) return;

    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('users')
        .update({
          notification_preferences: preferences
        })
        .eq('firebase_uid', user.uid);

      if (error) {
        throw error;
      }

      setMessage('Notification preferences saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage('Error saving preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean | string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!user) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <Bell className="h-8 w-8 text-purple-600 mx-auto" />
            <h3 className="font-semibold">Notification Settings</h3>
            <p className="text-sm text-muted-foreground">
              Please sign in to manage your notification preferences
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-purple-600" />
          Notification Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
          </div>
        ) : (
          <>
            {/* Daily Reminders */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Daily Upload Reminders</Label>
                <p className="text-xs text-muted-foreground">
                  Get reminded at 10 PM if you haven't uploaded your screen time
                </p>
              </div>
              <Switch
                checked={preferences.daily_reminders}
                onCheckedChange={(checked) => updatePreference('daily_reminders', checked)}
              />
            </div>

            {/* Reminder Time */}
            {preferences.daily_reminders && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Reminder Time</Label>
                <select
                  value={preferences.reminder_time}
                  onChange={(e) => updatePreference('reminder_time', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="21:00">9:00 PM</option>
                  <option value="21:30">9:30 PM</option>
                  <option value="22:00">10:00 PM</option>
                  <option value="22:30">10:30 PM</option>
                  <option value="23:00">11:00 PM</option>
                </select>
              </div>
            )}

            {/* Weekly Summary */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Weekly Summary</Label>
                <p className="text-xs text-muted-foreground">
                  Receive a weekly summary of your screen time trends
                </p>
              </div>
              <Switch
                checked={preferences.weekly_summary}
                onCheckedChange={(checked) => updatePreference('weekly_summary', checked)}
              />
            </div>

            {/* Competition Updates */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Competition Updates</Label>
                <p className="text-xs text-muted-foreground">
                  Get notified about leaderboard changes and competition results
                </p>
              </div>
              <Switch
                checked={preferences.competition_updates}
                onCheckedChange={(checked) => updatePreference('competition_updates', checked)}
              />
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <Button
                onClick={savePreferences}
                disabled={saving}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>

            {/* Message */}
            {message && (
              <div className={`p-3 rounded-lg text-sm ${
                message.includes('Error') 
                  ? 'bg-red-50 text-red-800 border border-red-200' 
                  : 'bg-green-50 text-green-800 border border-green-200'
              }`}>
                {message}
              </div>
            )}

            {/* Info */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-xs text-blue-800">
                  <p className="font-medium mb-1">How it works:</p>
                  <p>• Daily reminders are sent at your chosen time</p>
                  <p>• Only sent if you haven't uploaded your screen time that day</p>
                  <p>• You can disable any notification type at any time</p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 