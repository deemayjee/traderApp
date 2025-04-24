"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Bell,
  CreditCard,
  Lock,
  User,
  Shield,
  Globe,
  Moon,
  Sun,
  Key,
  AlertTriangle,
  Trash2,
  LogOut,
  Eye,
  EyeOff,
} from "lucide-react"
import { NotificationSettings } from "@/components/notification-settings"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile")
  const [showPassword, setShowPassword] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [compactMode, setCompactMode] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  const handleSaveChanges = () => {
    toast({
      title: "Settings saved",
      description: "Your changes have been saved successfully.",
    })
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-gray-500">Manage your account preferences and settings</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-64 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="w-full">
            <TabsList className="bg-gray-100 border border-gray-200 flex flex-col h-auto p-0 rounded-md">
              <TabsTrigger
                value="profile"
                className="data-[state=active]:bg-white flex items-center justify-start px-4 py-2 w-full"
              >
                <User size={16} className="mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger
                value="account"
                className="data-[state=active]:bg-white flex items-center justify-start px-4 py-2 w-full"
              >
                <Lock size={16} className="mr-2" />
                Account
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="data-[state=active]:bg-white flex items-center justify-start px-4 py-2 w-full"
              >
                <Bell size={16} className="mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger
                value="payment"
                className="data-[state=active]:bg-white flex items-center justify-start px-4 py-2 w-full"
              >
                <CreditCard size={16} className="mr-2" />
                Payment
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="data-[state=active]:bg-white flex items-center justify-start px-4 py-2 w-full"
              >
                <Shield size={16} className="mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger
                value="appearance"
                className="data-[state=active]:bg-white flex items-center justify-start px-4 py-2 w-full"
              >
                <Globe size={16} className="mr-2" />
                Appearance
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1">
          {activeTab === "profile" && (
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Manage your public profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src="/diverse-online-profiles.png" alt="User" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">Upload a new profile picture</p>
                    <div className="flex gap-2">
                      <Button variant="outline" className="border-gray-200">
                        Upload
                      </Button>
                      <Button variant="outline" className="border-gray-200 text-red-600">
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input id="firstName" defaultValue="John" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input id="lastName" defaultValue="Doe" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="john.doe@example.com" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" defaultValue="johndoe" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    className="w-full min-h-[100px] p-2 border border-gray-200 rounded-md"
                    defaultValue="Crypto enthusiast and trader since 2017. Focused on DeFi and emerging blockchain technologies."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="utc-8">
                    <SelectTrigger id="timezone" className="w-full">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc-12">UTC-12:00</SelectItem>
                      <SelectItem value="utc-11">UTC-11:00</SelectItem>
                      <SelectItem value="utc-10">UTC-10:00</SelectItem>
                      <SelectItem value="utc-9">UTC-09:00</SelectItem>
                      <SelectItem value="utc-8">UTC-08:00 (Pacific Time)</SelectItem>
                      <SelectItem value="utc-7">UTC-07:00 (Mountain Time)</SelectItem>
                      <SelectItem value="utc-6">UTC-06:00 (Central Time)</SelectItem>
                      <SelectItem value="utc-5">UTC-05:00 (Eastern Time)</SelectItem>
                      <SelectItem value="utc-4">UTC-04:00</SelectItem>
                      <SelectItem value="utc-3">UTC-03:00</SelectItem>
                      <SelectItem value="utc-2">UTC-02:00</SelectItem>
                      <SelectItem value="utc-1">UTC-01:00</SelectItem>
                      <SelectItem value="utc">UTC+00:00</SelectItem>
                      <SelectItem value="utc+1">UTC+01:00</SelectItem>
                      <SelectItem value="utc+2">UTC+02:00</SelectItem>
                      <SelectItem value="utc+3">UTC+03:00</SelectItem>
                      <SelectItem value="utc+4">UTC+04:00</SelectItem>
                      <SelectItem value="utc+5">UTC+05:00</SelectItem>
                      <SelectItem value="utc+6">UTC+06:00</SelectItem>
                      <SelectItem value="utc+7">UTC+07:00</SelectItem>
                      <SelectItem value="utc+8">UTC+08:00</SelectItem>
                      <SelectItem value="utc+9">UTC+09:00</SelectItem>
                      <SelectItem value="utc+10">UTC+10:00</SelectItem>
                      <SelectItem value="utc+11">UTC+11:00</SelectItem>
                      <SelectItem value="utc+12">UTC+12:00</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Preferences</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Public profile</p>
                        <p className="text-sm text-gray-500">Make your profile visible to other users</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Show trading history</p>
                        <p className="text-sm text-gray-500">Allow others to see your trading activity</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Display portfolio value</p>
                        <p className="text-sm text-gray-500">Show your portfolio value on your profile</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button variant="outline" className="border-gray-200">
                    Cancel
                  </Button>
                  <Button className="bg-black text-white hover:bg-gray-800" onClick={handleSaveChanges}>
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "account" && (
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>Manage your account settings and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Account Information</h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="account-email">Email Address</Label>
                      <Input id="account-email" type="email" defaultValue="john.doe@example.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account-phone">Phone Number</Label>
                      <Input id="account-phone" type="tel" defaultValue="+1 (555) 123-4567" />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Password</h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showPassword ? "text" : "password"}
                          defaultValue="currentpassword"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type={showPassword ? "text" : "password"} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input id="confirm-password" type={showPassword ? "text" : "password"} />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Account Management</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Deactivate Account</p>
                        <p className="text-sm text-gray-500">Temporarily disable your account</p>
                      </div>
                      <Button variant="outline" className="border-gray-200">
                        Deactivate
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-red-600">Delete Account</p>
                        <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
                      </div>
                      <Button variant="destructive">
                        <Trash2 size={16} className="mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button variant="outline" className="border-gray-200">
                    Cancel
                  </Button>
                  <Button className="bg-black text-white hover:bg-gray-800" onClick={handleSaveChanges}>
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage your notification preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <NotificationSettings />

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Additional Notification Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Price Alerts</p>
                        <p className="text-sm text-gray-500">Receive notifications for price movements</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Copy Trading Updates</p>
                        <p className="text-sm text-gray-500">Get notified about copy trading activities</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Community Mentions</p>
                        <p className="text-sm text-gray-500">Notifications when you're mentioned in the community</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Marketing Communications</p>
                        <p className="text-sm text-gray-500">Receive updates about new features and promotions</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button variant="outline" className="border-gray-200">
                    Cancel
                  </Button>
                  <Button className="bg-black text-white hover:bg-gray-800" onClick={handleSaveChanges}>
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "payment" && (
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Manage your payment methods and subscription</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Current Plan</h3>
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Pro Plan</p>
                        <p className="text-sm text-gray-500">$29.99/month, billed monthly</p>
                      </div>
                      <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                        Active
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button variant="outline" size="sm" className="border-gray-200">
                        Change Plan
                      </Button>
                      <Button variant="outline" size="sm" className="border-gray-200 text-red-600">
                        Cancel Subscription
                      </Button>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Payment Methods</h3>
                    <Button variant="outline" size="sm" className="border-gray-200">
                      <CreditCard size={16} className="mr-2" />
                      Add New
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-md">
                          <CreditCard size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">Visa ending in 4242</p>
                          <p className="text-sm text-gray-500">Expires 12/2025</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Billing History</h3>
                  <div className="border border-gray-200 rounded-md overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Invoice
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="px-4 py-3 text-sm">Apr 1, 2023</td>
                          <td className="px-4 py-3 text-sm">$29.99</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Paid</span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Button variant="ghost" size="sm" className="text-blue-600">
                              Download
                            </Button>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-sm">Mar 1, 2023</td>
                          <td className="px-4 py-3 text-sm">$29.99</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Paid</span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Button variant="ghost" size="sm" className="text-blue-600">
                              Download
                            </Button>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 text-sm">Feb 1, 2023</td>
                          <td className="px-4 py-3 text-sm">$29.99</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Paid</span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Button variant="ghost" size="sm" className="text-blue-600">
                              Download
                            </Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Manage your account security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Two-Factor Authentication (2FA)</p>
                        <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                      </div>
                      <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
                    </div>

                    {twoFactorEnabled && (
                      <div className="mt-4 space-y-4">
                        <div className="bg-white p-4 border border-gray-200 rounded-md">
                          <h4 className="font-medium mb-2">Scan QR Code</h4>
                          <div className="bg-gray-100 w-40 h-40 mx-auto mb-4 flex items-center justify-center">
                            <img src="/abstract-qr-code.png" alt="2FA QR Code" className="w-full h-full" />
                          </div>
                          <p className="text-sm text-gray-500 text-center mb-4">
                            Scan this QR code with your authenticator app
                          </p>
                          <div className="space-y-2">
                            <Label htmlFor="verification-code">Enter Verification Code</Label>
                            <Input id="verification-code" placeholder="Enter 6-digit code" />
                          </div>
                          <Button className="w-full mt-4 bg-black text-white hover:bg-gray-800">
                            Verify and Enable
                          </Button>
                        </div>

                        <div className="bg-yellow-50 p-4 border border-yellow-200 rounded-md">
                          <div className="flex items-start">
                            <AlertTriangle size={20} className="text-yellow-600 mr-2 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-yellow-800">Important</h4>
                              <p className="text-sm text-yellow-700">
                                Save your recovery codes in a safe place. If you lose access to your authenticator app,
                                you'll need these codes to regain access to your account.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Login Sessions</h3>
                  <div className="space-y-3">
                    <div className="p-4 border border-gray-200 rounded-md">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">Current Session</p>
                            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">Active</span>
                          </div>
                          <p className="text-sm text-gray-500">Chrome on macOS • San Francisco, CA</p>
                          <p className="text-xs text-gray-400 mt-1">Started Apr 15, 2023 • IP: 192.168.1.1</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-md">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Safari on iPhone</p>
                          <p className="text-sm text-gray-500">Mobile • New York, NY</p>
                          <p className="text-xs text-gray-400 mt-1">Last active Apr 14, 2023 • IP: 192.168.2.2</p>
                        </div>
                        <Button variant="outline" size="sm" className="text-red-600 border-gray-200">
                          Logout
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-md">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Firefox on Windows</p>
                          <p className="text-sm text-gray-500">Desktop • Chicago, IL</p>
                          <p className="text-xs text-gray-400 mt-1">Last active Apr 10, 2023 • IP: 192.168.3.3</p>
                        </div>
                        <Button variant="outline" size="sm" className="text-red-600 border-gray-200">
                          Logout
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full border-gray-200 text-red-600">
                    <LogOut size={16} className="mr-2" />
                    Logout from all other devices
                  </Button>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">API Keys</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Developer API Access</p>
                        <p className="text-sm text-gray-500">Enable API access to your account</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="p-4 border border-gray-200 rounded-md">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Trading Bot API Key</p>
                          <p className="text-sm text-gray-500">Created Apr 5, 2023 • Last used 2 days ago</p>
                        </div>
                        <Button variant="outline" size="sm" className="text-red-600 border-gray-200">
                          Revoke
                        </Button>
                      </div>
                    </div>

                    <Button variant="outline" className="border-gray-200">
                      <Key size={16} className="mr-2" />
                      Generate New API Key
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "appearance" && (
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how the application looks and feels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Theme</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className={`flex items-center space-x-2 border rounded-md p-4 cursor-pointer ${
                        !darkMode ? "border-black bg-gray-50" : "border-gray-200"
                      }`}
                      onClick={() => setDarkMode(false)}
                    >
                      <input
                        type="radio"
                        id="theme-light"
                        name="theme"
                        checked={!darkMode}
                        onChange={() => setDarkMode(false)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="theme-light" className="flex items-center cursor-pointer">
                        <Sun size={18} className="mr-2" />
                        Light
                      </Label>
                    </div>
                    <div
                      className={`flex items-center space-x-2 border rounded-md p-4 cursor-pointer ${
                        darkMode ? "border-black bg-gray-50" : "border-gray-200"
                      }`}
                      onClick={() => setDarkMode(true)}
                    >
                      <input
                        type="radio"
                        id="theme-dark"
                        name="theme"
                        checked={darkMode}
                        onChange={() => setDarkMode(true)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="theme-dark" className="flex items-center cursor-pointer">
                        <Moon size={18} className="mr-2" />
                        Dark
                      </Label>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Layout</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Compact Mode</p>
                        <p className="text-sm text-gray-500">Reduce spacing and size of elements</p>
                      </div>
                      <Switch checked={compactMode} onCheckedChange={setCompactMode} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Show Advanced Charts</p>
                        <p className="text-sm text-gray-500">Display detailed technical indicators</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Animations</p>
                        <p className="text-sm text-gray-500">Enable UI animations and transitions</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Dashboard Customization</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="widget-portfolio" defaultChecked />
                      <Label htmlFor="widget-portfolio">Portfolio Overview</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="widget-market" defaultChecked />
                      <Label htmlFor="widget-market">Market Overview</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="widget-signals" defaultChecked />
                      <Label htmlFor="widget-signals">Trading Signals</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="widget-news" defaultChecked />
                      <Label htmlFor="widget-news">News Feed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="widget-ai" defaultChecked />
                      <Label htmlFor="widget-ai">AI Insights</Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button variant="outline" className="border-gray-200">
                    Reset to Defaults
                  </Button>
                  <Button className="bg-black text-white hover:bg-gray-800" onClick={handleSaveChanges}>
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}
