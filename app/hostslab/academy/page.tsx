'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  GraduationCap,
  Play,
  CheckCircle,
  Lock,
  Award,
  Clock,
  BookOpen,
  Radar,
  DollarSign,
  TrendingUp,
  Shield,
  Star,
  ChevronRight,
} from 'lucide-react'

interface Course {
  id: string
  title: string
  description: string
  category: string
  lessons_count: number
  completed_lessons: number
  duration_minutes: number
  thumbnail_url?: string
  is_locked: boolean
  certification?: string
}

interface Certification {
  id: string
  name: string
  description: string
  course_id: string
  earned: boolean
  earned_at?: string
  badge_color: string
}

const CATEGORIES = [
  { id: 'all', name: 'All Courses', icon: BookOpen },
  { id: 'getting-started', name: 'Getting Started', icon: Play },
  { id: 'eagle', name: 'Eagle Mastery', icon: Radar },
  { id: 'dollar', name: 'Dollar Optimization', icon: DollarSign },
  { id: 'scaling', name: 'Fleet Scaling', icon: TrendingUp },
  { id: 'advanced', name: 'Advanced Pricing', icon: Star },
]

export default function AcademyPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/hostslab/academy/courses').then(r => r.json()),
      fetch('/api/hostslab/academy/certifications').then(r => r.json()),
    ])
      .then(([coursesData, certsData]) => {
        if (coursesData.courses) setCourses(coursesData.courses)
        if (certsData.certifications) setCertifications(certsData.certifications)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      </div>
    )
  }

  // Mock data
  const displayCourses = courses.length > 0 ? courses : [
    {
      id: '1',
      title: 'Welcome to Hosts Suite',
      description: 'Learn the basics of the Hosts Suite platform and set up your first vehicle listing.',
      category: 'getting-started',
      lessons_count: 5,
      completed_lessons: 5,
      duration_minutes: 30,
      is_locked: false,
      certification: 'Certified Host',
    },
    {
      id: '2',
      title: 'Eagle Fleet Tracking',
      description: 'Master the Eagle system for real-time GPS tracking and fleet monitoring.',
      category: 'eagle',
      lessons_count: 8,
      completed_lessons: 4,
      duration_minutes: 45,
      is_locked: false,
      certification: 'Eagle Operator',
    },
    {
      id: '3',
      title: 'Dollar Dynamic Pricing',
      description: 'Understand how the Dollar AI sets optimal prices for your vehicles.',
      category: 'dollar',
      lessons_count: 6,
      completed_lessons: 0,
      duration_minutes: 35,
      is_locked: false,
      certification: 'Pricing Pro',
    },
    {
      id: '4',
      title: 'Growing Your Fleet',
      description: 'Strategies for scaling from 1 to 10+ vehicles profitably.',
      category: 'scaling',
      lessons_count: 10,
      completed_lessons: 0,
      duration_minutes: 60,
      is_locked: true,
    },
    {
      id: '5',
      title: 'Seasonal Pricing Strategies',
      description: 'Advanced techniques for maximizing revenue during peak seasons.',
      category: 'advanced',
      lessons_count: 7,
      completed_lessons: 0,
      duration_minutes: 40,
      is_locked: true,
    },
    {
      id: '6',
      title: 'Shield Reputation Management',
      description: 'Learn how to maintain 5-star ratings and handle reviews professionally.',
      category: 'getting-started',
      lessons_count: 4,
      completed_lessons: 2,
      duration_minutes: 25,
      is_locked: false,
      certification: 'Reputation Master',
    },
  ]

  const displayCertifications = certifications.length > 0 ? certifications : [
    { id: '1', name: 'Certified Host', description: 'Completed basic training', course_id: '1', earned: true, earned_at: '2024-01-01', badge_color: 'bg-green-500' },
    { id: '2', name: 'Eagle Operator', description: 'Mastered fleet tracking', course_id: '2', earned: false, badge_color: 'bg-blue-500' },
    { id: '3', name: 'Pricing Pro', description: 'Dynamic pricing expert', course_id: '3', earned: false, badge_color: 'bg-amber-500' },
    { id: '4', name: 'Reputation Master', description: 'Review management guru', course_id: '6', earned: false, badge_color: 'bg-purple-500' },
  ]

  const filteredCourses = selectedCategory === 'all' 
    ? displayCourses 
    : displayCourses.filter(c => c.category === selectedCategory)

  const totalProgress = displayCourses.reduce((acc, c) => acc + c.completed_lessons, 0)
  const totalLessons = displayCourses.reduce((acc, c) => acc + c.lessons_count, 0)
  const overallProgress = totalLessons > 0 ? Math.round((totalProgress / totalLessons) * 100) : 0

  const earnedCerts = displayCertifications.filter(c => c.earned).length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#CC0000] rounded-lg">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">The Academy</h1>
            <p className="text-muted-foreground">Learn, certify, and level up your hosting skills</p>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Overall Progress</p>
                <p className="text-2xl font-bold">{overallProgress}%</p>
                <Progress value={overallProgress} className="h-2 mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lessons Completed</p>
                <p className="text-2xl font-bold">{totalProgress} / {totalLessons}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Award className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Certifications</p>
                <p className="text-2xl font-bold">{earnedCerts} / {displayCertifications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            <CardTitle>Your Certifications</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayCertifications.map((cert) => (
              <div 
                key={cert.id}
                className={`p-4 rounded-lg border text-center ${
                  cert.earned ? 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border-amber-200' : 'opacity-50'
                }`}
              >
                <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
                  cert.earned ? cert.badge_color : 'bg-slate-300 dark:bg-slate-700'
                }`}>
                  {cert.earned ? (
                    <Award className="h-8 w-8 text-white" />
                  ) : (
                    <Lock className="h-6 w-6 text-slate-500" />
                  )}
                </div>
                <h4 className="font-medium">{cert.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">{cert.description}</p>
                {cert.earned && cert.earned_at && (
                  <Badge className="mt-2 bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Earned
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Course Categories */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="flex-wrap h-auto gap-2 bg-transparent p-0">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            return (
              <TabsTrigger 
                key={cat.id}
                value={cat.id}
                className="data-[state=active]:bg-[#CC0000] data-[state=active]:text-white"
              >
                <Icon className="h-4 w-4 mr-2" />
                {cat.name}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const progress = course.lessons_count > 0 
                ? Math.round((course.completed_lessons / course.lessons_count) * 100) 
                : 0
              const isComplete = progress === 100

              return (
                <Card 
                  key={course.id}
                  className={`overflow-hidden ${course.is_locked ? 'opacity-60' : ''}`}
                >
                  {/* Course Thumbnail */}
                  <div className="relative h-32 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                    {CATEGORIES.find(c => c.id === course.category)?.icon && (
                      <div className="p-4 bg-white/50 dark:bg-black/30 rounded-full">
                        {(() => {
                          const Icon = CATEGORIES.find(c => c.id === course.category)?.icon || BookOpen
                          return <Icon className="h-10 w-10 text-[#CC0000]" />
                        })()}
                      </div>
                    )}
                    
                    {course.is_locked && (
                      <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                        <div className="p-3 bg-slate-800 rounded-full">
                          <Lock className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    )}

                    {isComplete && (
                      <Badge className="absolute top-3 right-3 bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Complete
                      </Badge>
                    )}

                    {course.certification && !course.is_locked && (
                      <Badge className="absolute top-3 left-3 bg-amber-500">
                        <Award className="h-3 w-3 mr-1" />
                        Certification
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-1">{course.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {course.description}
                    </p>

                    {/* Progress */}
                    {!course.is_locked && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>{course.completed_lessons} / {course.lessons_count} lessons</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}

                    {/* Meta */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDuration(course.duration_minutes)}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {course.lessons_count} lessons
                      </span>
                    </div>

                    {/* Action Button */}
                    <Button 
                      className="w-full"
                      variant={course.is_locked ? 'secondary' : isComplete ? 'outline' : 'default'}
                      disabled={course.is_locked}
                    >
                      {course.is_locked ? (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Unlock at Level 4
                        </>
                      ) : isComplete ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Review Course
                        </>
                      ) : course.completed_lessons > 0 ? (
                        <>
                          Continue
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Start Course
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
