"use client"

import { useState } from 'react'
import { Bell, Lock, Shield, User, Mail, LinkIcon, Globe, Check } from "lucide-react"
import { useQuery, useMutation } from '@apollo/client'
import { gql } from '@apollo/client'

const GET_USER_SETTINGS = gql`
  query GetUserSettings {
    me {
      id
      callbackUrl
      emailNotifications
      __typename
    }
  }
`;

const UPDATE_CALLBACK_URL = gql`
  mutation UpdateCallbackUrl($url: String!) {
    updateUserCallbackUrl(url: $url) {
      id
      callbackUrl
      __typename
    }
  }
`;

const UPDATE_EMAIL_NOTIFICATIONS = gql`
  mutation UpdateEmailNotifications($enabled: Boolean!) {
    updateEmailNotifications(enabled: $enabled) {
      id
      emailNotifications
      __typename
    }
  }
`;

export default function SettingsPage() {
  const [twoFactorAuth, setTwoFactorAuth] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [callbackUrl, setCallbackUrl] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const { data: userData, loading, refetch } = useQuery(GET_USER_SETTINGS, {
    fetchPolicy: 'no-cache',
    onCompleted: (data) => {
      console.log('Query completed with data:', data);
      if (data?.me) {
        setCallbackUrl(data.me.callbackUrl ?? '');
        setEmailNotifications(data.me.emailNotifications ?? true);
      }
    }
  });

  const [updateCallbackUrl] = useMutation(UPDATE_CALLBACK_URL, {
    onCompleted: async (data) => {
      console.log('Mutation completed with data:', data);
      if (data?.updateUserCallbackUrl?.callbackUrl !== undefined) {
        setCallbackUrl(data.updateUserCallbackUrl.callbackUrl);
      }
      setIsEditing(false);
      setSaveError('');
      await refetch();
    },
    onError: (error) => {
      setSaveError(error.message);
      console.error('Update error:', error);
    }
  });

  const [updateEmailNotifications] = useMutation(UPDATE_EMAIL_NOTIFICATIONS, {
    onCompleted: (data) => {
      console.log('Email notifications updated:', data);
    },
    onError: (error) => {
      console.error('Error updating email notifications:', error);
    }
  });

  const handleEmailNotificationsChange = async (enabled: boolean) => {
    try {
      await updateEmailNotifications({
        variables: { enabled }
      });
      setEmailNotifications(enabled);
    } catch (error) {
      console.error('Failed to update email notifications:', error);
    }
  };

  const handleSaveCallback = async () => {
    if (!callbackUrl) {
      setSaveError('Please enter a valid URL');
      return;
    }

    try {
      setIsSaving(true);
      setSaveError('');
      const { data } = await updateCallbackUrl({
        variables: { url: callbackUrl }
      });
      console.log('Save response:', data);
    } catch (error) {
      console.error('Error updating callback URL:', error);
      setSaveError('Failed to update callback URL');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {/* Account Settings */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium flex items-center gap-2">
          <User className="h-5 w-5 text-[#18B69B]" />
          Account Settings
        </h2>
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Email Notifications</h3>
                <p className="text-sm text-gray-500">Receive email notifications about account activity</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={emailNotifications}
                  onChange={(e) => handleEmailNotificationsChange(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#18B69B]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#18B69B]"></div>
              </label>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium">Callback URL</h3>
                <p className="text-sm text-gray-500">Receive webhooks and notifications at this URL</p>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[#18B69B] hover:bg-[#18B69B]/10 rounded-md transition-colors text-sm font-medium"
                >
                  <LinkIcon className="h-4 w-4" />
                  Edit URL
                </button>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="url"
                    value={callbackUrl}
                    onChange={(e) => {
                      setCallbackUrl(e.target.value);
                      setSaveError('');
                    }}
                    placeholder="https://your-domain.com/callback"
                    className={`w-full pl-9 pr-3 py-2.5 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#18B69B]/20 focus:border-[#18B69B] font-mono text-sm ${
                      saveError ? 'border-red-500' : 'border-gray-200'
                    }`}
                  />
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                {saveError && (
                  <p className="text-sm text-red-500">{saveError}</p>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveCallback}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#18B69B] text-white rounded-lg hover:bg-[#18B69B]/90 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Save URL
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setCallbackUrl(userData?.me?.callbackUrl || '');
                      setSaveError('');
                    }}
                    className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                <Globe className="h-4 w-4 text-gray-400 shrink-0" />
                <code className="text-sm font-mono text-gray-600 break-all">
                  {loading ? 'Loading...' : (callbackUrl || 'No callback URL set')}
                </code>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Security Settings */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium flex items-center gap-2">
          <Lock className="h-5 w-5 text-[#18B69B]" />
          Security Settings
        </h2>
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={twoFactorAuth}
                  onChange={(e) => setTwoFactorAuth(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#18B69B]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#18B69B]"></div>
              </label>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Password</h3>
                <p className="text-sm text-gray-500">Change your account password</p>
              </div>
              <button className="px-4 py-2 text-sm font-medium text-[#18B69B] hover:bg-[#18B69B]/10 rounded-lg transition-colors">
                Change Password
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Notification Settings */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium flex items-center gap-2">
          <Bell className="h-5 w-5 text-[#18B69B]" />
          Notification Settings
        </h2>
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Balance Updates</h3>
                  <p className="text-sm text-gray-500">Get notified about balance changes</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#18B69B]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#18B69B]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Security Alerts</h3>
                  <p className="text-sm text-gray-500">Get notified about suspicious activity</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#18B69B]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#18B69B]"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 