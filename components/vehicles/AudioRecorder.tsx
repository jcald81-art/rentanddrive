'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Play, Pause, Trash2, Upload, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AudioRecorderProps {
  onAudioSaved: (url: string, duration: number) => void
  existingAudioUrl?: string
  existingDuration?: number
  maxDuration?: number
  label?: string
  hint?: string
  className?: string
}

export function AudioRecorder({
  onAudioSaved,
  existingAudioUrl,
  existingDuration,
  maxDuration = 120, // 2 minutes default
  label = 'Audio Walkthrough',
  hint = 'Record a 30-90 second walkthrough of your vehicle',
  className,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(existingAudioUrl || null)
  const [duration, setDuration] = useState(existingDuration || 0)
  const [recordingTime, setRecordingTime] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const startRecording = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      })
      
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop())
        
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType })
        const localUrl = URL.createObjectURL(blob)
        setAudioUrl(localUrl)
        setDuration(recordingTime)
        
        // Upload to server
        await uploadAudio(blob)
      }

      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      setRecordingTime(0)
      
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxDuration) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
    } catch (err) {
      console.error('Failed to start recording:', err)
      setError('Microphone access denied. Please allow microphone access to record.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const uploadAudio = async (blob: Blob) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('audio', blob, 'walkthrough.webm')
      
      const res = await fetch('/api/vehicles/upload-audio', {
        method: 'POST',
        body: formData,
      })
      
      if (!res.ok) throw new Error('Upload failed')
      
      const { url } = await res.json()
      onAudioSaved(url, recordingTime)
    } catch (err) {
      console.error('Failed to upload audio:', err)
      setError('Failed to save audio. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const togglePlayback = () => {
    if (!audioUrl) return
    
    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrl)
      audioRef.current.onended = () => setIsPlaying(false)
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const deleteRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setAudioUrl(null)
    setDuration(0)
    setIsPlaying(false)
    onAudioSaved('', 0)
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs text-white/40 mb-1 font-medium uppercase tracking-wider">
            {label}
          </label>
          <p className="text-white/30 text-xs">{hint}</p>
        </div>
        {audioUrl && !isRecording && (
          <span className="text-xs text-green-400 flex items-center gap-1">
            <Check className="w-3 h-3" />
            {formatTime(duration)}
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-400 text-xs">
          {error}
        </div>
      )}

      <div className={cn(
        'rounded-xl border transition-all p-4',
        isRecording 
          ? 'border-[#e63946] bg-[#e63946]/10' 
          : audioUrl 
            ? 'border-green-500/30 bg-green-500/5'
            : 'border-white/10 bg-white/5'
      )}>
        {isRecording ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-[#e63946] animate-pulse" />
              <span className="text-white font-mono text-lg">{formatTime(recordingTime)}</span>
              <span className="text-white/40 text-xs">/ {formatTime(maxDuration)}</span>
            </div>
            <Button
              onClick={stopRecording}
              size="sm"
              className="bg-[#e63946] hover:bg-[#c1121f]"
            >
              <Square className="w-4 h-4 mr-2" />
              Stop
            </Button>
          </div>
        ) : audioUrl ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                onClick={togglePlayback}
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full border-green-500/30 hover:bg-green-500/10"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 text-green-400" />
                ) : (
                  <Play className="w-4 h-4 text-green-400 ml-0.5" />
                )}
              </Button>
              <div>
                <p className="text-sm font-medium text-white">Audio walkthrough</p>
                <p className="text-xs text-white/40">{formatTime(duration)} recorded</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isUploading && <Loader2 className="w-4 h-4 animate-spin text-white/40" />}
              <Button
                onClick={deleteRecording}
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/40 hover:text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={startRecording}
            className="w-full flex items-center justify-center gap-3 py-4 hover:bg-white/5 rounded-lg transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-[#e63946]/20 border border-[#e63946]/30 flex items-center justify-center">
              <Mic className="w-5 h-5 text-[#e63946]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">Tap to record</p>
              <p className="text-xs text-white/40">Tell renters about your vehicle</p>
            </div>
          </button>
        )}
      </div>

      {/* Recording tips */}
      {!audioUrl && !isRecording && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white/5 rounded-lg px-3 py-2 text-white/40 flex items-center gap-2">
            <span className="text-[#e63946]">1</span> Unique features
          </div>
          <div className="bg-white/5 rounded-lg px-3 py-2 text-white/40 flex items-center gap-2">
            <span className="text-[#e63946]">2</span> Local tips
          </div>
          <div className="bg-white/5 rounded-lg px-3 py-2 text-white/40 flex items-center gap-2">
            <span className="text-[#e63946]">3</span> Best uses
          </div>
          <div className="bg-white/5 rounded-lg px-3 py-2 text-white/40 flex items-center gap-2">
            <span className="text-[#e63946]">4</span> Pickup notes
          </div>
        </div>
      )}
    </div>
  )
}
