'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, 
  BellOff,
  Car,
  CreditCard,
  MessageSquare,
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowLeft,
  Check,
  CheckCheck,
  Filter
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  data: Record<string, string> | null
  is_read: boolean
  created_at: string
}

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  booking_confirmed: <Car className="h-5 w-5 text-green-600" />,
  booking_cancelled: <AlertTriangle className="h-5 w-5 text-amber-600" />,
  payment_received: <CreditCard className="h-5 w-5 text-green-600" />,
  new_message: <MessageSquare className="h-5 w-5 text-blue-600" />,
  new_review: <Star className="h-5 w-5 text-[#CC0000]" />,
  trip_reminder: <Clock className="h-5 w-5 text-[#CC0000]" />,
  verification_approved: <CheckCircle className="h-5 w-5 text-green-600" />,
  verification_rejected: <AlertTriangle className="h-5 w-5 text-red-600" />,
  default: <Bell className="h-5 w-5 text-muted-foreground" />,
}

const NOTIFICATION_ROUTES: Record<string, (data: Record<string, string> | null) => string> = {
  booking_confirmed: (data) => data?.booking_id ? `/bookings/${data.booking_id}` : '/bookings',
  booking_cancelled: (data) => data?.booking_id ? `/bookings/${data.booking_id}` : '/bookings',
  payment_received: () => '/bookings',
  new_message: (data) => data?.booking_id ? `/bookings/${data.booking_id}` : '/bookings',
  new_review: (data) => data?.vehicle_id ? `/vehicles/${data.vehicle_id}` : '/dashboard',
  trip_reminder: (data) => data?.booking_id ? `/trip/${data.booking_id}` : '/bookings',
  verification_approved: () => '/dashboard',
  verification_rejected: () => '/verify',
  default: () => '/dashboard',
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<string | null>(null)

  useEffect(() => {
    fetchNotifications()
  }, [])

  async function fetchNotifications() {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (!error && data) {
      setNotifications(data as Notification[])
    }
    setLoading(false)
  }

  async function markAsRead(notificationId: string) {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    if (!error) {
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ))
    }
  }

  async function markAllAsRead() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (!error) {
      setNotifications(notifications.map(n => ({ ...n, is_read: true })))
    }
  }

  function handleNotificationClick(notification: Notification) {
    // Mark as read
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
    
    // Navigate to relevant page
    const getRoute = NOTIFICATION_ROUTES[notification.type] || NOTIFICATION_ROUTES.default
    const route = getRoute(notification.data)
    router.push(route)
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const filteredNotifications = filterType 
    ? notifications.filter(n => n.type === filterType)
    : notifications

  const unreadCount = notifications.filter(n => !n.is_read).length

  const notificationTypes = [...new Set(notifications.map(n => n.type))]

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#CC0000] border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark all read
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  {filterType ? filterType.replace('_', ' ') : 'All'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterType(null)}>
                  All notifications
                </DropdownMenuItem>
                {notificationTypes.map(type => (
                  <DropdownMenuItem key={type} onClick={() => setFilterType(type)}>
                    {type.replace('_', ' ')}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notifications
            {unreadCount > 0 && (
              <Badge className="bg-[#CC0000]">{unreadCount} new</Badge>
            )}
          </h1>
        </div>

        {filteredNotifications.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <BellOff className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No notifications</h2>
            <p className="text-muted-foreground">
              {filterType 
                ? `No ${filterType.replace('_', ' ')} notifications`
                : "You're all caught up!"
              }
            </p>
          </div>
        ) : (
          /* Notification List */
          <div className="space-y-2">
            {filteredNotifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-left p-4 rounded-lg border transition-colors hover:bg-muted/50 ${
                  !notification.is_read ? 'bg-[#CC0000]/5 border-[#CC0000]/20' : 'bg-background'
                }`}
              >
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className="shrink-0 mt-0.5">
                    {NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.default}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`font-medium ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatTime(notification.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                  </div>

                  {/* Read indicator */}
                  {!notification.is_read && (
                    <div className="shrink-0">
                      <div className="h-2 w-2 rounded-full bg-[#CC0000]" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
