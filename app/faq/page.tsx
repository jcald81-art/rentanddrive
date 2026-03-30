'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const FAQ_CATEGORIES = [
  {
    name: 'For Renters',
    questions: [
      {
        q: 'How do I rent a vehicle on Rent and Drive?',
        a: 'Browse available vehicles, select your dates, and submit a booking request. The host will approve your request, and you\'ll complete payment through our secure checkout. You\'ll receive pickup instructions and your igloo lockbox PIN via SecureLink.'
      },
      {
        q: 'What are the requirements to rent?',
        a: 'You must be at least 21 years old (25 for luxury/specialty vehicles), have a valid driver\'s license, and pass our verification check. You\'ll need to upload your license and complete identity verification before your first rental.'
      },
      {
        q: 'How does vehicle pickup work?',
        a: 'Most vehicles use contactless pickup via igloo lockboxes. You\'ll receive a unique PIN code before your trip starts. The lockbox contains the vehicle keys. Some hosts offer in-person handoff instead.'
      },
      {
        q: 'What is the Cartegrity inspection?',
        a: 'Before and after each rental, you\'ll take photos of the vehicle from 8 angles using our app. This documents the vehicle\'s condition and protects both you and the host from unfair damage claims.'
      },
    ]
  },
  {
    name: 'For Hosts',
    questions: [
      {
        q: 'How much can I earn as a host?',
        a: 'Earnings vary by vehicle type, location, and availability. AWD SUVs in Reno can earn $1,000-2,500/month. Luxury vehicles can earn more. Our Dollar AI helps optimize your pricing for maximum earnings.'
      },
      {
        q: 'What are the fees for hosts?',
        a: 'We charge hosts 10% of each rental—significantly less than competitors who charge 25-35%. This means more money in your pocket for every trip.'
      },
      {
        q: 'Do I need special insurance?',
        a: 'During active rentals, our Tint insurance provides $1M liability coverage. Your personal insurance remains active when the vehicle isn\'t rented. We recommend notifying your personal insurer about P2P sharing.'
      },
      {
        q: 'What is HostsLab?',
        a: 'HostsLab is your AI-powered command center for managing your fleet. Access real-time GPS tracking, pricing recommendations, morning briefs, and gamified rewards for being a great host.'
      },
    ]
  },
  {
    name: 'Insurance',
    questions: [
      {
        q: 'What insurance coverage is included?',
        a: 'Every rental includes $1M liability coverage through Tint Insurance. This covers bodily injury and property damage to third parties. Comprehensive and collision coverage protects the rental vehicle with a $2,500 deductible (or $500 with Premium Protection).'
      },
      {
        q: 'How do I file an insurance claim?',
        a: 'Document any incident with photos immediately. Report to us within 24 hours through the app or by calling (775) 555-HELP. Our team will guide you through the claims process with Tint.'
      },
      {
        q: 'What isn\'t covered by insurance?',
        a: 'Exclusions include: damage from prohibited uses (racing, off-road), intentional damage, personal belongings, mechanical breakdown, interior damage from smoking/pets, and damage outside the rental period.'
      },
    ]
  },
  {
    name: 'Eagle GPS',
    questions: [
      {
        q: 'What is the Eagle system?',
        a: 'Eagle is our GPS fleet monitoring system using Bouncie devices. It tracks vehicle location, trip data, and driving behavior in real-time to ensure safety for hosts and renters.'
      },
      {
        q: 'Is my location tracked during rentals?',
        a: 'Yes. By using our platform, you consent to GPS tracking during rental periods. This data is used for safety, geofencing, and trip verification. Data is retained for 90 days after each rental.'
      },
      {
        q: 'What happens if I exceed speed limits?',
        a: 'The Eagle system monitors speed. Excessive speeding may trigger alerts to the host and affect your Renter Road score. Repeated violations can impact your ability to rent on our platform.'
      },
    ]
  },
  {
    name: 'Cartegrity Inspections',
    questions: [
      {
        q: 'Why are inspections required?',
        a: 'Inspections protect both parties by documenting vehicle condition. Without inspections, it\'s impossible to determine when damage occurred. Hosts and renters both benefit from this transparency.'
      },
      {
        q: 'What if I forget to complete an inspection?',
        a: 'Failure to complete inspections may result in you being held responsible for any damage claims. We send reminders via SMS and push notifications. The app won\'t release the lockbox PIN until pre-trip inspection is complete.'
      },
    ]
  },
  {
    name: 'Payments',
    questions: [
      {
        q: 'When am I charged for a rental?',
        a: 'You\'re charged when the host approves your booking. Security deposits are pre-authorized (not charged) and released within 72 hours of rental completion.'
      },
      {
        q: 'When do hosts get paid?',
        a: 'Hosts receive payment within 3 business days after each rental completes. Payments are sent via Stripe to your connected bank account.'
      },
      {
        q: 'What payment methods are accepted?',
        a: 'We accept all major credit and debit cards via Stripe. Apple Pay and Google Pay are also supported. We do not accept cash, checks, or cryptocurrency.'
      },
    ]
  },
  {
    name: 'Cancellations',
    questions: [
      {
        q: 'What is the cancellation policy?',
        a: 'Free cancellation more than 72 hours before trip start. 50% refund 24-72 hours before. No refund less than 24 hours before. Some hosts offer flexible policies—check the listing details.'
      },
      {
        q: 'What if a host cancels my booking?',
        a: 'You\'ll receive a full refund immediately. We\'ll help you find an alternative vehicle. Hosts who cancel frequently face penalties including reduced visibility and potential suspension.'
      },
    ]
  },
]

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [openItems, setOpenItems] = useState<string[]>([])

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const filteredCategories = FAQ_CATEGORIES.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
           q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0)

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Button variant="ghost" asChild className="mb-8">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>

        <h1 className="text-4xl font-bold mb-2">Frequently Asked Questions</h1>
        <p className="text-muted-foreground mb-8">
          Find answers to common questions about Rent and Drive
        </p>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Categories */}
        <div className="space-y-8">
          {filteredCategories.map((category) => (
            <div key={category.name}>
              <h2 className="text-xl font-semibold mb-4 text-[#CC0000]">
                {category.name}
              </h2>
              <div className="space-y-2">
                {category.questions.map((faq, index) => {
                  const id = `${category.name}-${index}`
                  const isOpen = openItems.includes(id)
                  return (
                    <div
                      key={id}
                      className="border rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleItem(id)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                      >
                        <span className="font-medium pr-4">{faq.q}</span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                            isOpen && "rotate-180"
                          )}
                        />
                      </button>
                      <div
                        className={cn(
                          "overflow-hidden transition-all",
                          isOpen ? "max-h-96" : "max-h-0"
                        )}
                      >
                        <p className="px-4 pb-4 text-muted-foreground">
                          {faq.a}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No questions found matching &quot;{searchQuery}&quot;
            </p>
            <Button
              variant="link"
              onClick={() => setSearchQuery('')}
              className="mt-2"
            >
              Clear search
            </Button>
          </div>
        )}

        {/* Still need help */}
        <div className="mt-12 p-6 bg-muted rounded-lg text-center">
          <h3 className="text-lg font-semibold mb-2">Still have questions?</h3>
          <p className="text-muted-foreground mb-4">
            Our support team is here to help 24/7
          </p>
          <Button asChild>
            <Link href="/contact">Contact Support</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
