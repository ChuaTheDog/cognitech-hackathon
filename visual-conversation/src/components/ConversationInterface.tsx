'use client'

import { Image as ImageIcon, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useRef, useState } from 'react'
import type React from 'react'

interface ConversationInterfaceProps {
  disabled?: boolean
}

export function ConversationInterface({ disabled = false }: ConversationInterfaceProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isBotTalking, setIsBotTalking] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const clearSelection = () => {
    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl)
    }
    setSelectedImageUrl(null)
    setErrorMessage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handlePlayAudioBase64 = (base64: string) => {
    if (!audioRef.current) return
    // Safer in-browser: use data URL instead of Buffer
    audioRef.current.src = `data:audio/mpeg;base64,${base64}`
    setIsBotTalking(true)
    audioRef.current.play()
    audioRef.current.onended = () => {
      setIsBotTalking(false)
    }
    audioRef.current.onerror = () => {
      setIsBotTalking(false)
    }
  }

  const sendImageToServer = async (file: File) => {
    setIsProcessing(true)
    setErrorMessage(null)
    try {
      const formData = new FormData()
      formData.append('image', file, file.name)

      const response = await fetch('/api/game', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }
      console.log('response', response)
      const result = await response.json()
      console.log('result', result)
      const base64 = result?.audio
      if (typeof base64 !== 'string' || base64.length === 0) {
        throw new Error('No audio data returned')
      }
      handlePlayAudioBase64(base64)
    } catch (err) {
      console.error('Error sending image:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsProcessing(false)
    }
  }

  const onFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files.item(0)
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload an image file')
      return
    }
    const previewUrl = URL.createObjectURL(file)
    if (selectedImageUrl) URL.revokeObjectURL(selectedImageUrl)
    setSelectedImageUrl(previewUrl)
    void sendImageToServer(file)
    // Allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (disabled || isProcessing || isBotTalking) return
    onFilesSelected(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled || isProcessing || isBotTalking) return
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const openFilePicker = () => {
    if (disabled || isProcessing || isBotTalking) return
    fileInputRef.current?.click()
  }

  const resetAll = () => {
    clearSelection()
    setIsBotTalking(false)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current.src = ''
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <Card className="h-64 overflow-hidden">
        <CardContent className="p-4 h-full flex flex-col items-center justify-center">
          <div className="text-center space-y-4">
            <div className="space-y-1">
              {isProcessing ? (
                <p className="text-blue-600 font-medium">Processing your image...</p>
              ) : isBotTalking ? (
                <p className="text-yellow-600 font-medium">Playing response...</p>
              ) : (
                <p className="text-muted-foreground">Drop an image to get an audio response</p>
              )}
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errorMessage}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-muted-foreground/20'
            } ${disabled || isProcessing || isBotTalking ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={openFilePicker}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFilesSelected(e.target.files)}
              disabled={disabled || isProcessing || isBotTalking}
            />

            <div className="flex flex-col items-center justify-center text-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                {isProcessing ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <ImageIcon className="h-6 w-6" />
                )}
              </div>
              <div>
                <p className="font-medium">
                  {disabled ? 'Wait for instructions...' : 'Drag & drop an image here'}
                </p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
              </div>

              {selectedImageUrl && (
                <div className="mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedImageUrl} alt="Selected" className="max-h-40 rounded-md" />
                </div>
              )}

              {(selectedImageUrl || isBotTalking) && (
                <div className="flex items-center gap-2 mt-2">
                   <Button
                    variant="outline"
                    onClick={(e) => { e.stopPropagation(); resetAll() }}
                    disabled={isProcessing}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <audio ref={audioRef} />
    </div>
  )
}
