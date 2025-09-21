'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { BarChart3, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'

interface AnalyticsTrackingItem {
  id?: string
  platform: string
  trackingId: string
  isEnabled: boolean
  environment?: string
}

const platforms = [
  { value: 'GOOGLE_ANALYTICS', label: 'Google Analytics (GA4)', placeholder: 'G-XXXXXXXXXX' },
  { value: 'META_PIXEL', label: 'Meta Pixel (Facebook & Instagram)', placeholder: '1234567890123456' },
  { value: 'TIKTOK_PIXEL', label: 'TikTok Pixel', placeholder: 'C4XXXXXXXXXXXXXXXXXX' },
  { value: 'GOOGLE_ADS', label: 'Google Ads', placeholder: 'AW-XXXXXXXXX' },
  { value: 'SNAPCHAT_PIXEL', label: 'Snapchat Pixel', placeholder: '12345678-1234-1234-1234-123456789012' },
]

export default function AnalyticsTrackingPage() {
  const [saving, setSaving] = useState(false)
  const [trackingItems, setTrackingItems] = useState<AnalyticsTrackingItem[]>([])
  const [newItem, setNewItem] = useState<AnalyticsTrackingItem>({
    platform: '',
    trackingId: '',
    isEnabled: true,
    environment: 'production'
  })

  // TODO: Load existing tracking items from API
  useEffect(() => {
    // Simulate loading data
    setTrackingItems([])
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      // TODO: Save to database via API
      console.log('Saving analytics tracking items:', trackingItems)
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Error saving analytics data:', error)
    } finally {
      setSaving(false)
    }
  }

  const addTrackingItem = () => {
    if (newItem.platform && newItem.trackingId) {
      // Check if platform already exists
      const existingPlatform = trackingItems.find(item => item.platform === newItem.platform)
      if (existingPlatform) {
        alert(`A tracking code for ${getPlatformInfo(newItem.platform)?.label} already exists. Please remove the existing one first.`)
        return
      }

      setTrackingItems(prev => [...prev, { ...newItem, id: Date.now().toString() }])
      setNewItem({
        platform: '',
        trackingId: '',
        isEnabled: true,
        environment: 'production'
      })
    }
  }

  const removeTrackingItem = (id: string) => {
    setTrackingItems(prev => prev.filter(item => item.id !== id))
  }

  const toggleEnabled = (id: string) => {
    setTrackingItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, isEnabled: !item.isEnabled } : item
      )
    )
  }

  const getPlatformInfo = (platformValue: string) => {
    return platforms.find(p => p.value === platformValue)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Analytics Tracking</h1>
        </div>
        <p className="text-gray-600">
          Configure tracking pixels and analytics IDs for your booking and checkout pages.
        </p>
      </div>

      {/* Existing Tracking Items */}
      {trackingItems.length > 0 && (
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Current Tracking Codes</h2>
          <div className="space-y-3">
            {trackingItems.map((item) => {
              const platformInfo = getPlatformInfo(item.platform)
              return (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-gray-900">{platformInfo?.label}</h3>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                        {item.environment || 'production'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 font-mono">{item.trackingId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleEnabled(item.id!)}
                      className="flex items-center gap-1 text-sm"
                    >
                      {item.isEnabled ? (
                        <>
                          <ToggleRight className="w-5 h-5 text-green-600" />
                          <span className="text-green-600">Enabled</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-400">Disabled</span>
                        </>
                      )}
                    </button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeTrackingItem(item.id!)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Add New Tracking Code */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Add New Tracking Code</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="platform">Platform</Label>
            <select
              id="platform"
              value={newItem.platform}
              onChange={(e) => setNewItem(prev => ({ ...prev, platform: e.target.value }))}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Platform</option>
              {platforms.map((platform) => (
                <option key={platform.value} value={platform.value}>
                  {platform.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="trackingId">Tracking ID</Label>
            <Input
              id="trackingId"
              type="text"
              placeholder={getPlatformInfo(newItem.platform)?.placeholder || "Enter tracking ID"}
              value={newItem.trackingId}
              onChange={(e) => setNewItem(prev => ({ ...prev, trackingId: e.target.value }))}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="environment">Environment</Label>
            <select
              id="environment"
              value={newItem.environment}
              onChange={(e) => setNewItem(prev => ({ ...prev, environment: e.target.value }))}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="production">Production</option>
              <option value="staging">Staging</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-gray-500">
            {getPlatformInfo(newItem.platform)?.placeholder && (
              <>Format: {getPlatformInfo(newItem.platform)?.placeholder}</>
            )}
          </p>
          <Button
            onClick={addTrackingItem}
            disabled={!newItem.platform || !newItem.trackingId}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Tracking Code
          </Button>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end mb-6">
        <Button
          onClick={handleSave}
          disabled={saving || trackingItems.length === 0}
          className="flex items-center gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>

      {/* Info Card */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold mb-2 text-blue-900">How it works</h3>
        <ul className="text-blue-800 space-y-1 text-sm">
          <li>• Add one tracking code per platform (Google Analytics, Meta Pixel, etc.)</li>
          <li>• Enable/disable tracking codes without deleting them</li>
          <li>• Use staging environment for testing before going live</li>
          <li>• Tracking codes automatically load on your booking and checkout pages</li>
          <li>• Events tracked: page views, event clicks, checkout starts, payment info added, and purchases</li>
          <li>• All tracking is GDPR and privacy compliant</li>
        </ul>
      </Card>
    </div>
  )
}