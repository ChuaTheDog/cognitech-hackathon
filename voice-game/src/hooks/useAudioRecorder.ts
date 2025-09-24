'use client'

import { useCallback, useRef, useState } from 'react'

export interface AudioRecorderState {
  isRecording: boolean
  isPaused: boolean
  recordingTime: number
  mediaRecorder: MediaRecorder | null
  audioBlob: Blob | null
  audioUrl: string | null
  error: string | null
}

export interface AudioRecorderControls {
  startRecording: () => Promise<void>
  stopRecording: () => Promise<Blob | null>
  pauseRecording: () => void
  resumeRecording: () => void
  resetRecording: () => void
}

export const useAudioRecorder = (): AudioRecorderState & AudioRecorderControls => {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    recordingTime: 0,
    mediaRecorder: null,
    audioBlob: null,
    audioUrl: null,
    error: null,
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }))

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      })

      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const audioUrl = URL.createObjectURL(audioBlob)
        
        setState(prev => ({
          ...prev,
          audioBlob,
          audioUrl,
          isRecording: false,
          isPaused: false,
        }))

        // Clean up
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }
      }

      mediaRecorder.start(100) // Collect data every 100ms

      setState(prev => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        recordingTime: 0,
        mediaRecorder,
      }))

      // Start timer
      intervalRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          recordingTime: prev.recordingTime + 1,
        }))
      }, 1000)

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to access microphone',
      }))
    }
  }, [])

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && state.isRecording) {
        // Set up a one-time listener for the stop event
        const handleStop = () => {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
          const audioUrl = URL.createObjectURL(audioBlob)
          
          setState(prev => ({
            ...prev,
            audioBlob,
            audioUrl,
            isRecording: false,
            isPaused: false,
          }))

          // Clean up
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
          }

          resolve(audioBlob)
        }

        // Override the onstop handler temporarily
        const originalOnStop = mediaRecorderRef.current.onstop
        mediaRecorderRef.current.onstop = handleStop
        
        mediaRecorderRef.current.stop()
        
        // Restore original handler
        setTimeout(() => {
          if (mediaRecorderRef.current) {
            mediaRecorderRef.current.onstop = originalOnStop
          }
        }, 100)
      } else {
        resolve(null)
      }

      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    })
  }, [state.isRecording])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && !state.isPaused) {
      mediaRecorderRef.current.pause()
      setState(prev => ({ ...prev, isPaused: true }))
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [state.isRecording, state.isPaused])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording && state.isPaused) {
      mediaRecorderRef.current.resume()
      setState(prev => ({ ...prev, isPaused: false }))
      
      // Resume timer
      intervalRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          recordingTime: prev.recordingTime + 1,
        }))
      }, 1000)
    }
  }, [state.isRecording, state.isPaused])

  const resetRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop()
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl)
    }

    setState({
      isRecording: false,
      isPaused: false,
      recordingTime: 0,
      mediaRecorder: null,
      audioBlob: null,
      audioUrl: null,
      error: null,
    })
  }, [state.isRecording, state.audioUrl])


  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
  }
}
