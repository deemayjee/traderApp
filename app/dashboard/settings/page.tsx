"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Bell,
  CreditCard,
  Lock,
  User,
  Shield,
  Globe,
  Key,
  AlertTriangle,
  Trash2,
  LogOut,
  Loader2,
} from "lucide-react"
import { NotificationSettings } from "@/components/notification-settings"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { SettingsService } from "@/lib/services/settings-service"
import { cn } from "@/lib/utils"
import { 
  UserProfile, 
  UserPreferences, 
  NotificationSettings as NotificationSettingsType, 
  SecuritySettings, 
  DashboardPreferences 
} from "@/lib/services/settings-service"
import { supabase, supabaseAdmin } from "@/lib/supabase"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile")
  const [showPassword, setShowPassword] = useState(false)
  const [compactMode, setCompactMode] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [timezoneValue, setTimezoneValue] = useState<string>("UTC")
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)
  const [emailValue, setEmailValue] = useState("")
  const settingsService = new SettingsService()

  // Add state variables for the new switches
  const [publicProfileChecked, setPublicProfileChecked] = useState(true)
  const [showTradingHistoryChecked, setShowTradingHistoryChecked] = useState(true)
  const [displayPortfolioValueChecked, setDisplayPortfolioValueChecked] = useState(false)

  // Profile states
  const [usernameValue, setUsernameValue] = useState("")
  const [bioValue, setBioValue] = useState("")
  
  // Add a loading state
  const [isLoading, setIsLoading] = useState(true)

  // Add state for account management
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Add state for notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    inAppNotifications: true,
    emailNotifications: true,
    signalAlerts: true,
    performanceAlerts: true,
    priceAlerts: false,
    copyTradingUpdates: true,
    communityMentions: true
  });

  // Add state and handlers for premium plan and billing history
  const [premiumActive, setPremiumActive] = useState(false);
  const [billingHistory, setBillingHistory] = useState<any[]>([]);

  // Add state for the new congrats modal
  const [showCongratsModal, setShowCongratsModal] = useState(false);

  // Add state for file upload
  const [isUploading, setIsUploading] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null)

  // Fetch the current profile when the component loads
  useEffect(() => {
    const fetchProfile = async () => {
      // TODO: Implement profile fetching
      setProfileLoaded(true)
    }

    const fetchNotificationSettings = async () => {
      // TODO: Implement notification settings fetching
    }

    const fetchSubscriptionSettings = async () => {
      // TODO: Implement subscription settings fetching
    }

    fetchProfile();
    fetchNotificationSettings();
    fetchSubscriptionSettings();
  }, []);

  const handleSaveChanges = async (tab: string) => {
    // TODO: Implement handleSaveChanges
  }

  const handleUpgradeToPremium = async () => {
    // TODO: Implement handleUpgradeToPremium
  }

  const handleCancelPremium = async () => {
    // TODO: Implement handleCancelPremium
  }

  // Add upload profile picture handler
  const handleUploadClick = () => {
    // Trigger the hidden file input
    if (fileInputRef) {
      fileInputRef.click()
    }
  }
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // TODO: Implement handleFileChange
  }
  
  // Add remove profile picture handler
  const handleRemoveProfilePicture = async () => {
    // TODO: Implement handleRemoveProfilePicture
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your account preferences and settings</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-64 space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="w-full">
              <TabsList className="bg-muted border border-border flex flex-col h-auto p-0 rounded-md">
                <TabsTrigger
                  value="profile"
                  className="data-[state=active]:bg-background flex items-center justify-start px-4 py-2 w-full"
                >
                  <User size={16} className="mr-2" />
                  Profile
                </TabsTrigger>
                <TabsTrigger
                  value="account"
                  className="data-[state=active]:bg-background flex items-center justify-start px-4 py-2 w-full"
                >
                  <Lock size={16} className="mr-2" />
                  Account
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="data-[state=active]:bg-background flex items-center justify-start px-4 py-2 w-full"
                >
                  <Bell size={16} className="mr-2" />
                  Notifications
                </TabsTrigger>
                <TabsTrigger
                  value="payment"
                  className="data-[state=active]:bg-background flex items-center justify-start px-4 py-2 w-full"
                >
                  <CreditCard size={16} className="mr-2" />
                  Payment
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex-1">
            {activeTab === "profile" && (
              <Card className="bg-background border-border">
                <CardHeader>
                  <CardTitle>Profile</CardTitle>
                  <CardDescription>Manage your public profile information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage 
                        src={profileData?.avatar_url || "/placeholder.svg"} 
                        alt={profileData?.username || "User"} 
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-muted">
                        {(profileData?.username?.charAt(0) || "U").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Upload a new profile picture</p>
                      <div className="flex gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileChange}
                          ref={(ref) => setFileInputRef(ref)}
                        />
                        <Button 
                          variant="outline" 
                          className="border-border"
                          onClick={handleUploadClick}
                          disabled={isUploading}
                        >
                          {isUploading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            "Upload"
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          className="border-border text-red-600"
                          onClick={handleRemoveProfilePicture}
                          disabled={isRemoving || !profileData?.avatar_url}
                        >
                          {isRemoving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Removing...
                            </>
                          ) : (
                            "Remove"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username" 
                      value={usernameValue}
                      onChange={(e) => setUsernameValue(e.target.value)}
                      placeholder="Enter username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={emailValue}
                      onChange={(e) => setEmailValue(e.target.value)}
                      placeholder="Enter email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea 
                      id="bio" 
                      value={bioValue}
                      onChange={(e) => setBioValue(e.target.value)}
                      placeholder="Tell us about yourself"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select 
                      key="timezone-select"
                      defaultValue={timezoneValue}
                      value={timezoneValue}
                      onValueChange={(value) => {
                        console.log("Timezone changed to:", value);
                        setTimezoneValue(value);
                      }}
                    >
                      <SelectTrigger id="timezone-trigger">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem key="UTC" value="UTC">UTC</SelectItem>
                        <SelectItem key="EST" value="EST">Eastern Time (EST)</SelectItem>
                        <SelectItem key="PST" value="PST">Pacific Time (PST)</SelectItem>
                        <SelectItem key="GMT" value="GMT">Greenwich Mean Time (GMT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Public profile</p>
                        <p className="text-sm text-muted-foreground">Make your profile visible to other users</p>
                      </div>
                      <Switch 
                        name="public-profile" 
                        checked={publicProfileChecked} 
                        onCheckedChange={setPublicProfileChecked} 
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Show trading history</p>
                        <p className="text-sm text-muted-foreground">Allow others to see your trading activity</p>
                      </div>
                      <Switch 
                        name="show-trading-history" 
                        checked={showTradingHistoryChecked} 
                        onCheckedChange={setShowTradingHistoryChecked} 
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Display portfolio value</p>
                        <p className="text-sm text-muted-foreground">Show your portfolio value on your profile</p>
                      </div>
                      <Switch 
                        name="display-portfolio-value" 
                        checked={displayPortfolioValueChecked} 
                        onCheckedChange={setDisplayPortfolioValueChecked} 
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button variant="outline" className="border-border">
                      Cancel
                    </Button>
                    <Button 
                      className="bg-primary text-primary-foreground hover:bg-primary/90" 
                      onClick={() => handleSaveChanges("profile")}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "account" && (
              <Card className="bg-background border-border">
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
                        <Input 
                          id="account-email" 
                          type="email" 
                          value={emailValue}
                          onChange={(e) => setEmailValue(e.target.value)}
                        />
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
                          <p className="text-sm text-muted-foreground">Temporarily disable your account</p>
                        </div>
                        <Button 
                          variant="outline" 
                          className="border-border"
                          onClick={() => setConfirmDeactivate(true)}
                        >
                          Deactivate
                        </Button>
                      </div>
                      
                      {confirmDeactivate && (
                        <div className="p-4 border border-orange-200 bg-orange-50 rounded-md">
                          <p className="font-medium text-orange-800 mb-2">Are you sure?</p>
                          <p className="text-sm text-orange-700 mb-3">
                            Your account will be temporarily disabled. You can reactivate it at any time by logging in again.
                          </p>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              className="border-border"
                              onClick={() => setConfirmDeactivate(false)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              className="bg-orange-600 text-white hover:bg-orange-700"
                              onClick={() => {
                                // In a real app this would call an API to deactivate the account
                                console.log("Account deactivation requested");
                                toast({
                                  title: "Account Deactivated",
                                  description: "Your account has been temporarily disabled.",
                                });
                                setConfirmDeactivate(false);
                              }}
                            >
                              Confirm Deactivation
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-red-600">Delete Account</p>
                          <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                        </div>
                        <Button 
                          variant="destructive"
                          onClick={() => setConfirmDelete(true)}
                        >
                          <Trash2 size={16} className="mr-2" />
                          Delete
                        </Button>
                      </div>
                      
                      {confirmDelete && (
                        <div className="p-4 border border-red-200 bg-red-50 rounded-md">
                          <p className="font-medium text-red-800 mb-2">Are you absolutely sure?</p>
                          <p className="text-sm text-red-700 mb-3">
                            This action is permanent and cannot be undone. All your data, including profile, settings, and wallet connections will be permanently deleted.
                          </p>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              className="border-border"
                              onClick={() => setConfirmDelete(false)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              variant="destructive"
                              onClick={() => {
                                // In a real app this would call an API to delete the account
                                console.log("Account deletion requested");
                                toast({
                                  title: "Account Deleted",
                                  description: "Your account has been permanently deleted.",
                                  variant: "destructive"
                                });
                                setConfirmDelete(false);
                              }}
                            >
                              Permanently Delete
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button variant="outline" className="border-border">
                      Cancel
                    </Button>
                    <Button 
                      className="bg-primary text-primary-foreground hover:bg-primary/90" 
                      onClick={() => handleSaveChanges("account")}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "notifications" && (
              <Card className="bg-background border-border">
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Manage your notification preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Delivery Methods</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">In-app Notifications</p>
                          <p className="text-sm text-muted-foreground">Receive notifications within the app</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.inAppNotifications}
                          onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, inAppNotifications: checked}))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.emailNotifications}
                          onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, emailNotifications: checked}))}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Notification Types</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Signal Alerts</p>
                          <p className="text-sm text-muted-foreground">Receive notifications for trading signals</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.signalAlerts}
                          onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, signalAlerts: checked}))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Performance Alerts</p>
                          <p className="text-sm text-muted-foreground">Get notified about performance updates</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.performanceAlerts}
                          onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, performanceAlerts: checked}))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Price Alerts</p>
                          <p className="text-sm text-muted-foreground">Receive notifications for price movements</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.priceAlerts}
                          onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, priceAlerts: checked}))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Copy Trading Updates</p>
                          <p className="text-sm text-muted-foreground">Get notified about copy trading activities</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.copyTradingUpdates}
                          onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, copyTradingUpdates: checked}))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Community Mentions</p>
                          <p className="text-sm text-muted-foreground">Notifications when you're mentioned in the community</p>
                        </div>
                        <Switch 
                          checked={notificationSettings.communityMentions}
                          onCheckedChange={(checked) => setNotificationSettings(prev => ({...prev, communityMentions: checked}))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <Button variant="outline" className="border-border">
                      Cancel
                    </Button>
                    <Button 
                      className="bg-primary text-primary-foreground hover:bg-primary/90" 
                      onClick={() => handleSaveChanges("notifications")}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "payment" && (
              <Card className="bg-background border-border">
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>Manage your payment methods and subscription</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Plan Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Current Plan</h3>
                    <div className="bg-muted/50 p-4 rounded-md border border-border">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{premiumActive ? "Premium Plan" : "Free Plan"}</p>
                          <p className="text-sm text-muted-foreground">
                            {premiumActive ? "0.02 SOL/month, billed monthly" : "Free forever"}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${premiumActive ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}`}>
                          {premiumActive ? "Active" : "Free"}
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        {!premiumActive && (
                          <Button variant="outline" size="sm" className="border-border bg-primary text-primary-foreground" onClick={handleUpgradeToPremium}>
                            Upgrade to Premium (0.02 SOL/month)
                          </Button>
                        )}
                        {premiumActive && (
                          <Button variant="outline" size="sm" className="border-border text-red-600" onClick={handleCancelPremium}>
                            Cancel Premium
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Billing History Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Billing History</h3>
                    <div className="border border-border rounded-md overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Transaction
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {billingHistory.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-3 text-center text-muted-foreground">No crypto payments yet</td>
                            </tr>
                          ) : (
                            billingHistory.map((item, idx) => (
                              <tr key={idx}>
                                <td className="px-4 py-3 text-sm">{item.date}</td>
                                <td className="px-4 py-3 text-sm">{item.amount} SOL</td>
                                <td className="px-4 py-3 text-sm">
                                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Paid</span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <a href={item.txUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600">View</a>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
      <Dialog open={showCongratsModal} onOpenChange={setShowCongratsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Congratulations!</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="text-lg font-semibold mb-2">Your account has been upgraded to Premium 🎉</p>
            <p className="text-muted-foreground mb-4">Enjoy all the benefits of your new plan.</p>
          </div>
          <DialogFooter>
            <Button className="w-full" onClick={() => setShowCongratsModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
