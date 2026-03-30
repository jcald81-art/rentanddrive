'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  HelpCircle, Phone, MessageSquare, MapPin, AlertCircle,
  ChevronDown, ChevronUp, Send, Navigation, Clock
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { toast } from 'sonner'

interface ChatMessage {
  id: string
  type: 'user' | 'support' | 'system'
  message: string
  timestamp: string
  quickReplies?: string[]
}

interface ActiveTrip {
  id: string
  vehicle: string
  end_date: string
  eagle_location?: {
    lat: number
    lng: number
    address: string
    updated_at: string
  }
}

const FAQ_ITEMS = [
  {
    question: 'How do I unlock the vehicle?',
    answer: 'Your SecureLink PIN will be displayed in the My Trips section. Enter this PIN on the igloo lockbox attached to the vehicle to retrieve the keys. The PIN is activated 15 minutes before your trip starts.'
  },
  {
    question: 'What if the vehicle isn\'t where it\'s supposed to be?',
    answer: 'Use the Eagle tracking feature in My Trips to see the vehicle\'s live location. If there\'s a significant discrepancy, contact the host directly or reach out to our support team.'
  },
  {
    question: 'How does Eagle GPS tracking work?',
    answer: 'Eagle is our GPS monitoring system powered by Bouncie devices. It tracks vehicle location in real-time, monitors driving behavior for your Road Score, and helps locate vehicles if there are any issues.'
  },
  {
    question: 'What insurance coverage is included?',
    answer: 'Basic liability coverage is included with every rental. You can upgrade to comprehensive coverage during booking for additional peace of mind. Check the My Coverage section for your current protection details.'
  },
  {
    question: 'Can I extend my trip?',
    answer: 'Yes! Go to My Trips, select your active trip, and tap "Extend Trip." Extensions are subject to vehicle availability and host approval.'
  },
  {
    question: 'What if I\'m late returning the vehicle?',
    answer: 'Late returns are charged at 1.5x the hourly rate. If you know you\'ll be late, extend your trip through the app to avoid late fees.'
  },
  {
    question: 'How do I report damage or an accident?',
    answer: 'Use the "Report Issue" button in your active trip immediately. Take photos of any damage and document what happened. Our team will guide you through the claims process.'
  },
  {
    question: 'What is Road Score and how is it calculated?',
    answer: 'Road Score (0-100) measures your driving quality based on speed compliance, smooth braking, and route adherence. Higher scores unlock perks like instant booking and discounts.'
  },
  {
    question: 'How do I earn badges and rewards?',
    answer: 'Complete trips, maintain good Road Scores, share photos on social media, and refer friends. Visit The Game Room to track your progress and see available challenges.'
  },
  {
    question: 'Can I cancel a reservation?',
    answer: 'Yes, but refund policies vary by timing. Cancellations 48+ hours before get a full refund. 24-48 hours gets 50%. Less than 24 hours may be non-refundable. Check the booking details for specific policies.'
  },
]

const QUICK_REPLIES = [
  'I can\'t find the vehicle',
  'The lockbox won\'t open',
  'I need to extend my trip',
  'There\'s an issue with the vehicle',
  'I have a billing question',
]

export default function SupportPage() {
  const [openFaqs, setOpenFaqs] = useState<number[]>([])
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [issueType, setIssueType] = useState('')
  const [issueDescription, setIssueDescription] = useState('')
  const [submittingIssue, setSubmittingIssue] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Mock active trip
    setActiveTrip({
      id: '123',
      vehicle: '2023 Toyota 4Runner',
      end_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      eagle_location: {
        lat: 39.5296,
        lng: -119.8138,
        address: '123 Virginia St, Reno, NV',
        updated_at: new Date().toISOString(),
      }
    })

    // Initial chat message
    setChatMessages([
      {
        id: '1',
        type: 'support',
        message: 'Hi there! I\'m here to help with your Rent and Drive experience. What can I assist you with today?',
        timestamp: new Date().toISOString(),
        quickReplies: QUICK_REPLIES,
      }
    ])
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const toggleFaq = (index: number) => {
    setOpenFaqs(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const sendMessage = (message: string) => {
    if (!message.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: message.trim(),
      timestamp: new Date().toISOString(),
    }

    setChatMessages(prev => [...prev, userMessage])
    setNewMessage('')

    // Simulate support response
    setTimeout(() => {
      const supportResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'support',
        message: getAutoResponse(message),
        timestamp: new Date().toISOString(),
        quickReplies: ['That helped, thanks!', 'I need more help', 'Connect me to a human'],
      }
      setChatMessages(prev => [...prev, supportResponse])
    }, 1000)
  }

  const getAutoResponse = (message: string): string => {
    const lower = message.toLowerCase()
    if (lower.includes('lockbox') || lower.includes('pin')) {
      return 'Your SecureLink PIN is displayed in the My Trips section. Make sure to enter it exactly as shown. If it\'s still not working, try pressing the reset button on the lockbox and waiting 10 seconds before trying again.'
    }
    if (lower.includes('extend') || lower.includes('longer')) {
      return 'To extend your trip, go to My Trips, select your active booking, and tap "Extend Trip." The extension is subject to vehicle availability and host approval. You\'ll be charged the daily rate for additional days.'
    }
    if (lower.includes('find') || lower.includes('locate')) {
      return 'I see you have an active trip. Check the Eagle location map below to see the vehicle\'s current location. The address shown should help you find it. If there\'s a significant discrepancy, let me know!'
    }
    return 'I understand. Let me look into this for you. If you need immediate assistance, you can call our 24/7 support line at (775) 555-0199. Is there anything else I can help with?'
  }

  const handleQuickReply = (reply: string) => {
    sendMessage(reply)
  }

  const submitIssue = async () => {
    if (!issueType || !issueDescription) {
      toast.error('Please fill in all fields')
      return
    }

    setSubmittingIssue(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    toast.success('Issue reported! Our team will contact you shortly.')
    setIssueType('')
    setIssueDescription('')
    setSubmittingIssue(false)
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Renter Support</h1>

      {/* Emergency Contact for Active Trip */}
      {activeTrip && (
        <Card className="bg-[#CC0000]/20 border-[#CC0000]/50">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Phone className="h-8 w-8 text-[#CC0000]" />
                <div>
                  <p className="font-bold text-white">24/7 Emergency Support</p>
                  <p className="text-slate-300">For your active trip: {activeTrip.vehicle}</p>
                </div>
              </div>
              <Button asChild className="bg-[#CC0000] hover:bg-[#AA0000] text-lg px-6">
                <a href="tel:+17755550199">
                  <Phone className="h-5 w-5 mr-2" />
                  (775) 555-0199
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Eagle Location for Active Trip */}
          {activeTrip?.eagle_location && (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-[#CC0000]" />
                  Vehicle Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-slate-800 rounded-lg mb-4 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-8 w-8 text-[#CC0000] mx-auto mb-2" />
                    <p className="text-white font-medium">{activeTrip.eagle_location.address}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      <Clock className="h-3 w-3 inline mr-1" />
                      Updated {new Date(activeTrip.eagle_location.updated_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-400">
                  <Navigation className="h-3 w-3 mr-1" />
                  Eagle Active
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* FAQ Accordion */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-[#CC0000]" />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {FAQ_ITEMS.map((item, index) => (
                <Collapsible key={index} open={openFaqs.includes(index)}>
                  <CollapsibleTrigger
                    onClick={() => toggleFaq(index)}
                    className="flex items-center justify-between w-full p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors text-left"
                  >
                    <span className="text-white font-medium text-sm">{item.question}</span>
                    {openFaqs.includes(index) ? (
                      <ChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-3 py-2 text-sm text-slate-400">
                    {item.answer}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* SecureLink Chat */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#CC0000]" />
                SecureLink Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 overflow-y-auto space-y-3 mb-4 p-2">
                {chatMessages.map((msg) => (
                  <div key={msg.id}>
                    <div className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.type === 'user' 
                          ? 'bg-[#CC0000] text-white'
                          : 'bg-slate-800 text-slate-200'
                      }`}>
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-[10px] opacity-60 mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    {msg.quickReplies && (
                      <div className="flex flex-wrap gap-2 mt-2 ml-2">
                        {msg.quickReplies.map((reply, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="border-slate-700 text-slate-300 text-xs"
                            onClick={() => handleQuickReply(reply)}
                          >
                            {reply}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="bg-slate-800 border-slate-700 text-white"
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage(newMessage)}
                />
                <Button 
                  onClick={() => sendMessage(newMessage)}
                  className="bg-[#CC0000] hover:bg-[#AA0000]"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Report Issue Form */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Report an Issue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-400">Issue Type</Label>
                <Select value={issueType} onValueChange={setIssueType}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select issue type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700">
                    <SelectItem value="vehicle_damage">Vehicle Damage</SelectItem>
                    <SelectItem value="mechanical">Mechanical Issue</SelectItem>
                    <SelectItem value="lockbox">Lockbox Problem</SelectItem>
                    <SelectItem value="cleanliness">Cleanliness Issue</SelectItem>
                    <SelectItem value="billing">Billing Question</SelectItem>
                    <SelectItem value="accident">Accident</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-400">Description</Label>
                <Textarea
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Please describe the issue in detail..."
                  className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
                />
              </div>
              <Button 
                onClick={submitIssue}
                disabled={submittingIssue}
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                {submittingIssue ? 'Submitting...' : 'Submit Issue'}
              </Button>
            </CardContent>
          </Card>

          {/* Contact Host */}
          {activeTrip && (
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-4">
                <Button variant="outline" className="w-full border-slate-700 text-slate-300">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact Host
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
