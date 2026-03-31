'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'

import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle,
  BookOpen,
  Clock,
  Award,
  Loader2,
  Sparkles,
  ArrowLeft,
} from 'lucide-react'

interface Slide {
  id: number
  title: string
  content: string
  bulletPoints?: string[]
  tip?: string
  imagePrompt?: string
}

interface Lesson {
  id: string
  title: string
  description: string
  duration_minutes: number
  slides: Slide[]
  completed: boolean
}

interface Course {
  id: string
  title: string
  description: string
  category: string
  lessons: Lesson[]
  certification?: string
}

// Course data with real lessons
const COURSES: Record<string, Course> = {
  '1': {
    id: '1',
    title: 'Welcome to HostsLab',
    description: 'Learn the basics of the HostsLab platform and set up your first vehicle listing.',
    category: 'getting-started',
    certification: 'Certified Host',
    lessons: [
      {
        id: '1-1',
        title: 'Introduction to HostsLab',
        description: 'Overview of the platform and its AI-powered features',
        duration_minutes: 5,
        completed: false,
        slides: [
          {
            id: 1,
            title: 'Welcome to HostsLab',
            content: 'HostsLab is your AI-powered command center for managing your vehicle rental fleet. Whether you have one car or fifty, our platform helps you maximize earnings while minimizing effort.',
            bulletPoints: [
              'AI-optimized pricing with Dollar Agent',
              'Real-time GPS tracking with Eagle System',
              'Automated guest communications with SecureLink',
              'Reputation management with Shield AI'
            ]
          },
          {
            id: 2,
            title: 'Your Dashboard',
            content: 'The HostsLab dashboard is designed to give you instant visibility into your fleet performance. At a glance, you can see active bookings, earnings, and any items needing your attention.',
            tip: 'Pro Tip: Check your dashboard every morning to stay on top of new booking requests!'
          },
          {
            id: 3,
            title: 'Getting Started Checklist',
            content: 'To get the most out of HostsLab, complete these essential setup steps:',
            bulletPoints: [
              'Complete your host profile with photo and bio',
              'Add your first vehicle with quality photos',
              'Set your availability calendar',
              'Configure your pricing preferences',
              'Enable notifications for instant booking alerts'
            ]
          }
        ]
      },
      {
        id: '1-2',
        title: 'Creating Your First Listing',
        description: 'Step-by-step guide to listing your vehicle',
        duration_minutes: 8,
        completed: false,
        slides: [
          {
            id: 1,
            title: 'Vehicle Photos That Convert',
            content: 'Great photos are the #1 factor in getting bookings. Vehicles with professional-quality photos get 40% more bookings than those with amateur shots.',
            bulletPoints: [
              'Use natural daylight - early morning or late afternoon works best',
              'Clean your vehicle inside and out before shooting',
              'Take at least 10 photos: exterior angles, interior, trunk, features',
              'Include close-ups of special features like leather seats or tech',
              'Show the vehicle in an attractive location'
            ],
            tip: 'Our top hosts hire a professional photographer for $50-100. It pays for itself in the first week!'
          },
          {
            id: 2,
            title: 'Writing Your Description',
            content: 'Your description should highlight what makes your vehicle special and address common renter questions upfront.',
            bulletPoints: [
              'Start with the most exciting feature',
              'Mention fuel economy and practical details',
              'Describe the driving experience',
              'List included amenities (Bluetooth, backup camera, etc.)',
              'Set expectations about pickup/dropoff'
            ]
          },
          {
            id: 3,
            title: 'Setting Your Base Price',
            content: 'Dollar Agent will help optimize your pricing, but you need to set a competitive base price first.',
            bulletPoints: [
              'Research similar vehicles in your area',
              'Start 10-15% below competitors to build reviews',
              'Factor in your costs: insurance, maintenance, cleaning',
              'Consider your minimum acceptable daily rate',
              'Dollar Agent will adjust up to 30% based on demand'
            ],
            tip: 'In Reno, economy cars average $45-65/day, SUVs $75-100/day, and luxury vehicles $150-250/day.'
          }
        ]
      },
      {
        id: '1-3',
        title: 'Understanding the Booking Flow',
        description: 'How bookings work from request to completion',
        duration_minutes: 6,
        completed: false,
        slides: [
          {
            id: 1,
            title: 'Booking Request',
            content: 'When a renter wants your vehicle, you will receive a booking request. You have 4 hours to respond before it expires.',
            bulletPoints: [
              'Review the renter profile and verification status',
              'Check their rental history and reviews',
              'Verify the dates work with your schedule',
              'Accept, decline, or send a message with questions'
            ],
            tip: 'Hosts who respond within 1 hour have 60% higher booking rates!'
          },
          {
            id: 2,
            title: 'Before the Trip',
            content: 'Once a booking is confirmed, prepare for a smooth handoff:',
            bulletPoints: [
              'SecureLink will handle initial guest communication',
              'Send a personal welcome message 24 hours before',
              'Confirm pickup location and time',
              'Ensure vehicle is cleaned and fueled',
              'Document the vehicle condition with photos'
            ]
          },
          {
            id: 3,
            title: 'During and After',
            content: 'While the renter has your vehicle, Eagle System keeps you informed. After the trip, complete these steps:',
            bulletPoints: [
              'Monitor vehicle location if needed via Eagle',
              'Be available for questions via SecureLink',
              'Inspect vehicle upon return',
              'Document any issues immediately',
              'Leave an honest review for the renter'
            ],
            tip: 'Reviews are reciprocal - leave one within 24 hours to prompt the renter to do the same!'
          }
        ]
      },
      {
        id: '1-4',
        title: 'Maximizing Your Earnings',
        description: 'Tips and strategies for higher revenue',
        duration_minutes: 7,
        completed: false,
        slides: [
          {
            id: 1,
            title: 'The 5-Star Formula',
            content: 'Consistently high ratings unlock better visibility and premium pricing. Here is what top-rated hosts do differently:',
            bulletPoints: [
              'Spotless cleanliness - inside and out, every time',
              'Clear, proactive communication',
              'Flexible and punctual with pickup/dropoff',
              'Small extras: phone charger, water bottles, local guide',
              'Quick issue resolution without excuses'
            ]
          },
          {
            id: 2,
            title: 'Pricing Strategies',
            content: 'Smart pricing can increase your earnings by 20-40% without getting fewer bookings.',
            bulletPoints: [
              'Enable Dollar Agent dynamic pricing',
              'Set higher weekend rates (Friday-Sunday)',
              'Offer weekly discounts (15-20% off)',
              'Charge more during local events and holidays',
              'Lower prices for last-minute bookings to avoid idle days'
            ],
            tip: 'Dollar Agent learns your market over 2-3 weeks. Trust the AI but monitor results!'
          },
          {
            id: 3,
            title: 'Growing Your Fleet',
            content: 'Once you have mastered one vehicle, consider scaling up:',
            bulletPoints: [
              'Maintain 4.8+ rating before adding vehicles',
              'Diversify: economy, SUV, and specialty vehicles',
              'Consider different pickup locations',
              'Build systems for cleaning and maintenance',
              'Use the Academy courses to level up your skills'
            ]
          }
        ]
      },
      {
        id: '1-5',
        title: 'Course Summary & Certification',
        description: 'Review and earn your Certified Host badge',
        duration_minutes: 4,
        completed: false,
        slides: [
          {
            id: 1,
            title: 'What You Have Learned',
            content: 'Congratulations on completing the Welcome to HostsLab course! Let us review what you have learned:',
            bulletPoints: [
              'How to navigate the HostsLab dashboard',
              'Creating listings that convert with great photos and descriptions',
              'Setting competitive prices with Dollar Agent assistance',
              'Managing bookings from request to review',
              'Strategies for 5-star ratings and maximum earnings'
            ]
          },
          {
            id: 2,
            title: 'Your Certified Host Badge',
            content: 'You have earned the Certified Host badge! This badge shows renters that you have completed official training and understand best practices.',
            bulletPoints: [
              'Badge appears on your host profile',
              'Increases renter trust and booking rates',
              'Unlocks access to advanced courses',
              'Qualifies you for promotional features'
            ],
            tip: 'Continue to Eagle Mastery or Dollar Optimization to earn more badges!'
          },
          {
            id: 3,
            title: 'Next Steps',
            content: 'Your hosting journey has just begun! Here is what to do next:',
            bulletPoints: [
              'List your first vehicle if you have not already',
              'Take the Eagle Fleet Tracking course',
              'Master Dollar Dynamic Pricing',
              'Join the host community forum',
              'Set a goal for your first month of earnings'
            ]
          }
        ]
      }
    ]
  },
  '2': {
    id: '2',
    title: 'Eagle Fleet Tracking',
    description: 'Master the Eagle system for real-time GPS tracking and fleet monitoring.',
    category: 'eagle',
    certification: 'Eagle Operator',
    lessons: [
      {
        id: '2-1',
        title: 'Introduction to Eagle System',
        description: 'Understanding real-time fleet monitoring',
        duration_minutes: 6,
        completed: false,
        slides: [
          {
            id: 1,
            title: 'What is Eagle System?',
            content: 'Eagle is your eyes in the sky for fleet management. It provides real-time GPS tracking, geofencing, trip analytics, and security alerts for all your vehicles.',
            bulletPoints: [
              'Live location tracking updated every 30 seconds',
              'Geofence alerts when vehicles leave designated areas',
              'Trip history and route visualization',
              'Speed and driving behavior monitoring',
              'Theft prevention and recovery assistance'
            ]
          },
          {
            id: 2,
            title: 'Setting Up Tracking',
            content: 'Eagle works with various GPS devices. Here is how to get started:',
            bulletPoints: [
              'OBD-II plug-and-play devices (recommended)',
              'Hardwired GPS trackers for permanent installation',
              'Mobile app tracking for basic monitoring',
              'Each vehicle needs a unique device ID'
            ],
            tip: 'We recommend the Bouncie or LandAirSea trackers - affordable and reliable!'
          },
          {
            id: 3,
            title: 'The Eagle Dashboard',
            content: 'Your Eagle dashboard shows all vehicles at a glance with color-coded status indicators:',
            bulletPoints: [
              'Green: Vehicle is parked and secure',
              'Blue: Vehicle is on an active trip',
              'Yellow: Vehicle is outside normal hours',
              'Red: Alert condition requiring attention'
            ]
          }
        ]
      },
      {
        id: '2-2',
        title: 'Geofencing and Alerts',
        description: 'Setting boundaries and monitoring vehicle movement',
        duration_minutes: 7,
        completed: false,
        slides: [
          {
            id: 1,
            title: 'Understanding Geofences',
            content: 'A geofence is a virtual boundary around a geographic area. When a vehicle enters or exits this boundary, Eagle triggers an alert.',
            bulletPoints: [
              'Define pickup/dropoff zones',
              'Set regional boundaries (e.g., no out-of-state trips)',
              'Mark prohibited areas (airports with fees, etc.)',
              'Create custom zones for your market'
            ]
          },
          {
            id: 2,
            title: 'Alert Configuration',
            content: 'Customize which events trigger notifications and how you receive them:',
            bulletPoints: [
              'Geofence entry/exit alerts',
              'Speed threshold violations',
              'After-hours movement',
              'Low battery on tracker device',
              'Choose: push notification, SMS, or email'
            ],
            tip: 'Start with fewer alerts and add more as needed - alert fatigue is real!'
          }
        ]
      }
    ]
  },
  '3': {
    id: '3',
    title: 'Dollar Dynamic Pricing',
    description: 'Understand how the Dollar AI sets optimal prices for your vehicles.',
    category: 'dollar',
    certification: 'Pricing Pro',
    lessons: [
      {
        id: '3-1',
        title: 'How Dollar AI Works',
        description: 'Understanding AI-powered dynamic pricing',
        duration_minutes: 8,
        completed: false,
        slides: [
          {
            id: 1,
            title: 'The Science of Dynamic Pricing',
            content: 'Dollar Agent analyzes dozens of factors in real-time to set the optimal price for your vehicles - maximizing both bookings and revenue.',
            bulletPoints: [
              'Local supply and demand patterns',
              'Competitor pricing in your market',
              'Seasonal trends and events',
              'Day-of-week patterns',
              'Your vehicle specific performance data'
            ]
          },
          {
            id: 2,
            title: 'Price Factors',
            content: 'Here is what Dollar Agent considers when setting your daily rate:',
            bulletPoints: [
              'Base price you set (your floor)',
              'Similar vehicles within 10 miles',
              'Upcoming local events (concerts, conventions)',
              'Weather forecasts (ski season, summer travel)',
              'Your booking rate and reviews',
              'Days until the trip (last-minute vs. advance)'
            ],
            tip: 'Dollar Agent can adjust prices by up to 50% in high-demand periods!'
          },
          {
            id: 3,
            title: 'Trust the Algorithm',
            content: 'Dollar Agent gets smarter over time. Here is how to get the best results:',
            bulletPoints: [
              'Let it run for 2-3 weeks before making changes',
              'Set realistic floor and ceiling prices',
              'Review weekly performance reports',
              'Adjust only when you see clear patterns',
              'Enable auto-adjustment for maximum efficiency'
            ]
          }
        ]
      }
    ]
  },
  '6': {
    id: '6',
    title: 'Shield Reputation Management',
    description: 'Learn how to maintain 5-star ratings and handle reviews professionally.',
    category: 'getting-started',
    certification: 'Reputation Master',
    lessons: [
      {
        id: '6-1',
        title: 'The Power of Reviews',
        description: 'Why ratings matter and how they affect your business',
        duration_minutes: 6,
        completed: false,
        slides: [
          {
            id: 1,
            title: 'Reviews Drive Bookings',
            content: 'On Rent and Drive, your reputation is everything. Vehicles with 4.8+ stars get 3x more bookings than those with 4.5 or below.',
            bulletPoints: [
              '85% of renters read reviews before booking',
              'First review is worth more than the tenth',
              'Negative reviews stay visible for 12 months',
              'Review responses show your professionalism'
            ]
          },
          {
            id: 2,
            title: 'Shield AI Monitoring',
            content: 'Shield AI helps you stay ahead of reputation issues:',
            bulletPoints: [
              'Instant alerts when new reviews are posted',
              'Sentiment analysis to catch negative trends',
              'Suggested response templates',
              'Competitor review benchmarking',
              'Tips based on common feedback themes'
            ],
            tip: 'Always respond to reviews within 24 hours - even positive ones!'
          }
        ]
      }
    ]
  }
}

export default function CoursePlayerPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string
  
  const [course, setCourse] = useState<Course | null>(null)
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [completedSlides, setCompletedSlides] = useState<Set<string>>(new Set())
  
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null)
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Load course data
    const courseData = COURSES[courseId]
    if (courseData) {
      setCourse(courseData)
    }
    setLoading(false)
  }, [courseId])

  const currentLesson = course?.lessons[currentLessonIndex]
  const currentSlide = currentLesson?.slides[currentSlideIndex]
  const totalSlides = currentLesson?.slides.length || 0
  
  const slideKey = `${currentLessonIndex}-${currentSlideIndex}`
  
  // Calculate overall progress
  const totalLessons = course?.lessons.length || 0
  const totalAllSlides = course?.lessons.reduce((acc, l) => acc + l.slides.length, 0) || 0
  const overallProgress = totalAllSlides > 0 
    ? Math.round((completedSlides.size / totalAllSlides) * 100) 
    : 0

  // Text-to-speech functionality
  const speakSlide = (slide: Slide) => {
    if (isMuted || !('speechSynthesis' in window)) return
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel()
    
    // Build the speech text
    let textToSpeak = slide.title + '. ' + slide.content
    if (slide.bulletPoints) {
      textToSpeak += ' Key points: ' + slide.bulletPoints.join('. ')
    }
    if (slide.tip) {
      textToSpeak += ' Pro tip: ' + slide.tip
    }
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    utterance.rate = 0.9
    utterance.pitch = 1
    utterance.volume = 1
    
    // Try to find a good voice
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find(v => 
      v.name.includes('Samantha') || 
      v.name.includes('Google') || 
      v.name.includes('Microsoft')
    )
    if (preferredVoice) {
      utterance.voice = preferredVoice
    }
    
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => {
      setIsSpeaking(false)
      // Mark slide as completed
      setCompletedSlides(prev => new Set([...prev, slideKey]))
      
      // Auto-advance if playing
      if (isPlaying) {
        autoPlayRef.current = setTimeout(() => {
          handleNext()
        }, 1000)
      }
    }
    
    speechRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
    if (autoPlayRef.current) {
      clearTimeout(autoPlayRef.current)
    }
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false)
      stopSpeaking()
    } else {
      setIsPlaying(true)
      if (currentSlide) {
        speakSlide(currentSlide)
      }
    }
  }

  const handleNext = () => {
    stopSpeaking()
    
    if (currentSlideIndex < totalSlides - 1) {
      setCurrentSlideIndex(prev => prev + 1)
    } else if (currentLessonIndex < totalLessons - 1) {
      // Move to next lesson
      setCurrentLessonIndex(prev => prev + 1)
      setCurrentSlideIndex(0)
    }
  }

  const handlePrevious = () => {
    stopSpeaking()
    
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1)
    } else if (currentLessonIndex > 0) {
      // Move to previous lesson
      const prevLessonIndex = currentLessonIndex - 1
      const prevLesson = course?.lessons[prevLessonIndex]
      setCurrentLessonIndex(prevLessonIndex)
      setCurrentSlideIndex((prevLesson?.slides.length || 1) - 1)
    }
  }

  const handleRestart = () => {
    stopSpeaking()
    setCurrentSlideIndex(0)
    if (isPlaying && currentLesson?.slides[0]) {
      setTimeout(() => speakSlide(currentLesson.slides[0]), 100)
    }
  }

  const handleMuteToggle = () => {
    if (!isMuted) {
      stopSpeaking()
    }
    setIsMuted(!isMuted)
  }

  const goToLesson = (lessonIndex: number) => {
    stopSpeaking()
    setCurrentLessonIndex(lessonIndex)
    setCurrentSlideIndex(0)
    setIsPlaying(false)
  }

  // Auto-play when slide changes
  useEffect(() => {
    if (isPlaying && currentSlide && !isSpeaking) {
      speakSlide(currentSlide)
    }
  }, [currentSlideIndex, currentLessonIndex, isPlaying])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeaking()
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] p-6">
        <Skeleton className="h-12 w-64 mb-6" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <Card className="bg-[#151c2c] border-white/10 p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-4">Course Not Found</h2>
          <p className="text-gray-400 mb-6">This course is not available yet.</p>
          <Button asChild>
            <Link href="/hostslab/academy">Back to Academy</Link>
          </Button>
        </Card>
      </div>
    )
  }

  const isLastSlide = currentSlideIndex === totalSlides - 1 && currentLessonIndex === totalLessons - 1

  return (
  <div className="min-h-screen bg-[#0a0f1a]">
  {/* Course Header */}
  <header className="border-b border-white/10 bg-[#0d1220]">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="text-white/70 hover:text-white">
              <Link href="/hostslab/academy">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Academy
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              Progress: {overallProgress}%
            </div>
            <Progress value={overallProgress} className="w-32 h-2" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-[300px_1fr] gap-6">
          {/* Sidebar - Lesson List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">{course.title}</h2>
            <div className="space-y-2">
              {course.lessons.map((lesson, index) => {
                const lessonCompleted = lesson.slides.every((_, sIdx) => 
                  completedSlides.has(`${index}-${sIdx}`)
                )
                const lessonStarted = lesson.slides.some((_, sIdx) => 
                  completedSlides.has(`${index}-${sIdx}`)
                )
                
                return (
                  <button
                    key={lesson.id}
                    onClick={() => goToLesson(index)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      currentLessonIndex === index
                        ? 'bg-[#D62828] text-white'
                        : 'bg-[#151c2c] text-gray-300 hover:bg-[#1a2236]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        lessonCompleted 
                          ? 'bg-green-500 text-white' 
                          : lessonStarted
                          ? 'bg-amber-500 text-white'
                          : 'bg-white/20 text-white'
                      }`}>
                        {lessonCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{lesson.title}</p>
                        <p className="text-xs opacity-70">{lesson.duration_minutes} min</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            
            {course.certification && (
              <Card className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/30">
                <CardContent className="p-4 text-center">
                  <Award className="h-8 w-8 mx-auto mb-2 text-amber-400" />
                  <p className="text-sm font-medium text-amber-300">Complete to earn</p>
                  <p className="text-amber-100 font-bold">{course.certification}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content - Slide Viewer */}
          <div className="space-y-4">
            {/* Current Lesson Header */}
            <div className="flex items-center justify-between">
              <div>
                <Badge className="bg-[#D62828] mb-2">
                  Lesson {currentLessonIndex + 1} of {totalLessons}
                </Badge>
                <h1 className="text-2xl font-bold text-white">{currentLesson?.title}</h1>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="h-4 w-4" />
                <span>{currentLesson?.duration_minutes} min</span>
              </div>
            </div>

            {/* Slide Content */}
            <Card className="bg-[#151c2c] border-white/10 overflow-hidden">
              <div className="bg-gradient-to-r from-[#D62828] to-[#a31d1d] px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">{currentSlide?.title}</h2>
                  <Badge variant="outline" className="border-white/30 text-white">
                    Slide {currentSlideIndex + 1} / {totalSlides}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-8">
                <div className="prose prose-invert max-w-none">
                  <p className="text-lg text-gray-200 leading-relaxed mb-6">
                    {currentSlide?.content}
                  </p>
                  
                  {currentSlide?.bulletPoints && (
                    <ul className="space-y-3 mb-6">
                      {currentSlide.bulletPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-gray-300">
                          <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  {currentSlide?.tip && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex gap-3">
                      <Sparkles className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-300 mb-1">Pro Tip</p>
                        <p className="text-amber-200/80">{currentSlide.tip}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>

              {/* Progress Bar */}
              <div className="px-6 pb-2">
                <Progress 
                  value={((currentSlideIndex + 1) / totalSlides) * 100} 
                  className="h-1"
                />
              </div>

              {/* Controls */}
              <div className="border-t border-white/10 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRestart}
                      className="text-gray-400 hover:text-white"
                    >
                      <RotateCcw className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleMuteToggle}
                      className="text-gray-400 hover:text-white"
                    >
                      {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                    {isSpeaking && (
                      <Badge variant="outline" className="border-green-500/50 text-green-400 animate-pulse">
                        Speaking...
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentSlideIndex === 0 && currentLessonIndex === 0}
                      className="border-white/20"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    
                    <Button
                      onClick={handlePlayPause}
                      className={isPlaying ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#D62828] hover:bg-[#b82222]'}
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Play with Voice
                        </>
                      )}
                    </Button>
                    
                    {isLastSlide ? (
                      <Button
                        onClick={() => router.push('/hostslab/academy')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Award className="h-4 w-4 mr-2" />
                        Complete Course
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={handleNext}
                        className="border-white/20"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Keyboard Shortcuts Info */}
            <p className="text-center text-sm text-gray-500">
              Use arrow keys to navigate slides. Press Space to play/pause voiceover.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
