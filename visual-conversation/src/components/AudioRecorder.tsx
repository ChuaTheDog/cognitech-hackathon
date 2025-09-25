'use client'

import { Mic, X, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'

interface AudioRecorderProps {
  onRecordingComplete?: (audioBlob: Blob) => void
  disabled?: boolean
}

export function AudioRecorder({ onRecordingComplete, disabled = false }: AudioRecorderProps) {
  const {
    isRecording,
    recordingTime,
    audioBlob,
    audioUrl,
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

  const handleSendRecording = async () => {
    const recordedBlob = await stopRecording()
    if (recordedBlob && onRecordingComplete) {
      onRecordingComplete(recordedBlob)
    }
  }

  const handleCancelRecording = () => {
    resetRecording()
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Mic className="h-6 w-6" />
          Audio Recorder
        </CardTitle>
        <CardDescription>
          Record your audio in WebM format
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recording Status */}
        <div className="text-center">
          {isRecording && (
            <div className="flex items-center justify-center gap-2 text-red-500">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="font-medium">
                Recording - {formatTime(recordingTime)}
              </span>
            </div>
          )}
          
          {audioBlob && !isRecording && (
            <div className="flex items-center justify-center gap-2 text-green-500">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="font-medium">Recording Complete!</span>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Recording Controls */}
        <div className="flex justify-center gap-2">
          {!isRecording && (
            <Button
              onClick={startRecording}
              className="flex items-center gap-2"
              size="lg"
              disabled={disabled}
            >
              <Mic className="h-4 w-4" />
              {disabled ? 'Wait for instructions...' : 'Start Recording'}
            </Button>
          )}

          {isRecording && (
            <>
              <Button
                onClick={handleCancelRecording}
                variant="outline"
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSendRecording}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Send
              </Button>
            </>
          )}
        </div>

        {/* Audio Playback */}
        {audioUrl && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-center">Your Recording:</p>
            <audio
              controls
              src={audioUrl}
              className="w-full"
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

        {/* Recording Info */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Format: WebM (Opus codec)</p>
          <p>Sample Rate: 44.1kHz</p>
        </div>
      </CardContent>
    </Card>
  )
}
