'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Loader2, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { AIPersonaSwitcher } from '@/components/ai-persona-switcher'
import type { AIPersona } from '@/lib/ai-personas'
import { toast } from 'sonner'

export default function AIPersonaSettingsPage() {
  const router = useRouter()
  const [persona, setPersona] = useState<AIPersona>('RAD')
  const [originalPersona, setOriginalPersona] = useState<AIPersona>('RAD')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadPersona() {
      try {
        const res = await fetch('/api/host/ai-persona')
        const data = await res.json()
        setPersona(data.persona || 'RAD')
        setOriginalPersona(data.persona || 'RAD')
      } catch {
        // Default to RAD
      } finally {
        setLoading(false)
      }
    }
    loadPersona()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/host/ai-persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona }),
      })
      
      if (!res.ok) throw new Error('Failed to save')
      
      setOriginalPersona(persona)
      toast.success(
        persona === 'RAD' 
          ? "Sweet! You're now cruisin' with RAD 🏄" 
          : "Welcome to the beta squad! R&D activated 🔬"
      )
      router.refresh()
    } catch {
      toast.error('Failed to save preference')
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = persona !== originalPersona

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Link href="/host/settings" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Settings
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-[#D62828]" />
          Choose Your AI Assistant
        </h1>
        <p className="text-muted-foreground mt-2">
          Pick the AI personality that matches your vibe. Switch anytime!
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>R&D vs RAD</CardTitle>
          <CardDescription>
            Two unique AI personalities for different experiences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AIPersonaSwitcher 
            currentPersona={persona} 
            onPersonaChange={setPersona} 
          />
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>What This Means</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg bg-[#D62828]/5 border border-[#D62828]/20">
              <h3 className="font-semibold text-[#D62828] mb-2">R&D - Beta Tester</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Early access to new features</li>
                <li>• Help shape the product roadmap</li>
                <li>• Professional, data-driven AI tone</li>
                <li>• May encounter experimental features</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-[#00B4D8]/5 border border-[#00B4D8]/20">
              <h3 className="font-semibold text-[#00B4D8] mb-2">RAD - Production Ready</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Stable, proven features only</li>
                <li>• Chill, laid-back AI personality</li>
                <li>• No surprises - just smooth sailing</li>
                <li>• Perfect for those who like it easy</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || saving}
          className={persona === 'RAD' ? 'bg-[#00B4D8] hover:bg-[#0096C7]' : 'bg-[#D62828] hover:bg-[#B82222]'}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Preference
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
