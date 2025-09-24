'use client'

import { Mic, Send, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import { useState, useRef } from 'react'

interface ConversationInterfaceProps {
  disabled?: boolean
}

export function ConversationInterface({ disabled = false }: ConversationInterfaceProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentItems, setCurrentItems] = useState<string[]>([])
  const [isBotTalking, setIsBotTalking] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const {
    isRecording,
    isPaused,
    recordingTime,
    audioBlob,
    error,
    startRecording,
    stopRecording,
    resetRecording,
  } = useAudioRecorder()

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }


  const handleSendAudio = async () => {
    if (!audioBlob) return

    setIsProcessing(true)
    
    try {
      // Send audio to AI
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      formData.append('currentItems', JSON.stringify(currentItems))

      const response = await fetch('/api/game', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        const audioData = Buffer.from(result.audioData, 'base64')
        const audioBlob = new Blob([audioData], { type: 'audio/mpeg' })
        const audioUrl = URL.createObjectURL(audioBlob)

        setCurrentItems(result.newItems || [])

        if (audioRef.current) {
          audioRef.current.src = audioUrl
          setIsBotTalking(true)
          audioRef.current.play()
          audioRef.current.onended = () => {
            setIsBotTalking(false)
          }
          audioRef.current.onerror = () => {
            setIsBotTalking(false)
          }
        }
      } else {
        throw new Error('Failed to get AI response')
      }
    } catch (error) {
      console.error('Error sending audio:', error)
    } finally {
      setIsProcessing(false)
      resetRecording()
    }
  }

  const handleSendRecording = async () => {
    // Stop recording and immediately send the message
    const recordedBlob = await stopRecording()
    if (recordedBlob) {
      // Create a temporary audioBlob for sending
      const tempAudioBlob = recordedBlob
      setIsProcessing(true)
      
      try {
        // Send audio to AI
        const formData = new FormData()
        formData.append('audio', tempAudioBlob, 'recording.webm')
        formData.append('currentItems', JSON.stringify(currentItems))

        const response = await fetch('/api/game', {
          method: 'POST',
          body: formData,
        })

        if (response.ok) {
          const result = await response.json()
          const audioData = Buffer.from(result.audioData, 'base64')
          const audioBlob = new Blob([audioData], { type: 'audio/mpeg' })
          const audioUrl = URL.createObjectURL(audioBlob)

          setCurrentItems(result.newItems || [])

          if (audioRef.current) {
            audioRef.current.src = audioUrl
            setIsBotTalking(true)
            audioRef.current.play()
            audioRef.current.onended = () => {
              setIsBotTalking(false)
            }
            audioRef.current.onerror = () => {
              setIsBotTalking(false)
            }
          }
        } else {
          throw new Error('Failed to get AI response')
        }
      } catch (error) {
        console.error('Error sending audio:', error)
      } finally {
        setIsProcessing(false)
        resetRecording()
      }
    }
  }

  const handleCancelRecording = () => {
    resetRecording()
  }

  const resetGame = () => {
    setCurrentItems([])
    setIsBotTalking(false)
    resetRecording()
    
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Game Status */}
      <Card className="h-64 overflow-hidden">
        <CardContent className="p-4 h-full flex flex-col items-center justify-center">
          <div className="text-center space-y-6">
            {/* Status Text */}
            <div className="space-y-2">
              {isProcessing ? (
                <p className="text-blue-600 font-medium">Processing your message...</p>
              ) : isBotTalking ? (
                <p className="text-yellow-600 font-medium">Bot is responding...</p>
              ) : currentItems.length > 0 ? (
                <p className="text-green-600 font-medium">Ready for your next item!</p>
              ) : (
                <p className="text-muted-foreground">I'm packing my suitcase and in it I have ...</p>
              )}
            </div>
            
            {/* Current Items Display */}
            {currentItems.length > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium mb-2">Current items:</p>
                <p className="text-blue-700">{currentItems.join(', ')}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recording Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Recording Status */}
            {isRecording && (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-red-500">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="font-medium">
                    {isPaused ? 'Paused' : 'Recording'} - {formatTime(recordingTime)}
                  </span>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}


            {/* Controls */}
            <div className="flex justify-center gap-2">
              {!isRecording && !isProcessing && (
                <Button
                  onClick={startRecording}
                  className="flex items-center gap-2"
                  size="lg"
                  disabled={disabled || isBotTalking}
                >
                  <Mic className="h-4 w-4" />
                  {disabled ? 'Wait for instructions...' : isBotTalking ? 'Bot is speaking...' : 'Start Recording'}
                </Button>
              )}

              {isProcessing && (
                <Button
                  disabled
                  className="flex items-center gap-2"
                  size="lg"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </Button>
              )}

              {isRecording && (
                <>
                  <Button
                    onClick={handleCancelRecording}
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={isProcessing}
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendRecording}
                    variant="destructive"
                    className="flex items-center gap-2"
                    disabled={isProcessing}
                  >
                    <Send className="h-4 w-4" />
                    Send Message
                  </Button>
                </>
              )}

              {/* Reset Game Button */}
              {currentItems.length > 0 && !isRecording && !isProcessing && (
                <Button
                  onClick={resetGame}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  Reset Game
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hidden audio element for auto-play */}
      <audio ref={audioRef} />
    </div>
  )
}
