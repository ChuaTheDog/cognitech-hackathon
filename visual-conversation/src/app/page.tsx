'use client'

import { CheckCircle, Mic, Gamepad2, Menu, X, Image as ImageIcon, UploadCloud, Trash, RefreshCcw } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AudioRecorder } from '@/components/AudioRecorder'

export default function Home() {
  const [isGameActive, setIsGameActive] = useState(false)
  const [hasRecorded, setHasRecorded] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleRecordingComplete = (audioBlob: Blob) => {
    setHasRecorded(true)
    console.log('Recording completed:', audioBlob)
  }

  const startGame = () => {
    setIsGameActive(true)
    setHasRecorded(false)
  }

  const resetGame = () => {
    if (!selectedImage) return
    
    setIsGameActive(false)
    setHasRecorded(false)
  }

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features')
    if (featuresSection) {
      featuresSection.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileMenuOpen])

  const validateAndSetImage = (file: File) => {
    setImageError(null)
    const maxSizeBytes = 10 * 1024 * 1024 // 10MB
    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file.')
      return
    }
    if (file.size > maxSizeBytes) {
      setImageError('Image is too large. Max size is 10MB.')
      return
    }
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    setSelectedImage(file)
    const url = URL.createObjectURL(file)
    setImagePreviewUrl(url)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      validateAndSetImage(file)
    } else {
      setSelectedImage(null)
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
      setImagePreviewUrl(null)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) validateAndSetImage(file)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const removeSelectedImage = () => {
    setSelectedImage(null)
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    setImagePreviewUrl(null)
    setImageError(null)
  }

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl)
    }
  }, [imagePreviewUrl])

  return (
    <div className='flex min-h-screen flex-col'>
      <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
        <div className='container mx-auto flex h-16 max-w-7xl items-center justify-between px-4'>
          <motion.div
            className='flex cursor-pointer items-center space-x-2 rounded-lg px-2 py-1 transition-colors'
            onClick={scrollToTop}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            title='Click to scroll to top'
          >
            <Gamepad2 className='h-8 w-8 text-primary' />
            <span className='text-xl font-bold'>Voice Game</span>
          </motion.div>
          <nav className='hidden items-center space-x-6 md:flex'>
            <Button
              variant='ghost'
              className='text-sm font-medium'
              onClick={() => window.open('https://github.com', '_blank')}
            >
              GitHub
            </Button>
          </nav>
          <div className='md:hidden'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className='p-2'
            >
              {isMobileMenuOpen ? (
                <X className='h-5 w-5' />
              ) : (
                <Menu className='h-5 w-5' />
              )}
            </Button>
          </div>
        </div>
        {isMobileMenuOpen && (
          <motion.div
            ref={mobileMenuRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className='border-t bg-background/95 backdrop-blur md:hidden'
          >
            <div className='container mx-auto space-y-2 px-4 py-4'>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className='w-full'
              >
                <Button
                  variant='ghost'
                  className='w-full justify-start'
                  onClick={() => {
                    scrollToFeatures()
                    setIsMobileMenuOpen(false)
                  }}
                >
                  Features
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className='w-full'
              >
                <Button
                  variant='ghost'
                  className='w-full justify-start'
                  onClick={() => {
                    window.open('https://github.com', '_blank')
                    setIsMobileMenuOpen(false)
                  }}
                >
                  GitHub
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </header>

      <main className='flex-1'>
        <section className='space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-20'>
          <div className='container flex max-w-[64rem] flex-col items-center gap-8 text-center'>
            <div className='space-y-4'>
              <h1 className='font-heading text-3xl sm:text-5xl md:text-6xl'>
                <span className='flex items-center justify-center gap-4'>
                  <Gamepad2 className='h-16 w-16 text-primary sm:h-20 sm:w-20' />
                  Audio Recording
                </span>
                <br />
                <span className='text-muted-foreground'>Mini-Game</span>
              </h1>
              <p className='max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8'>
                Test your voice recording skills! Record an audio file in WebM
                format and see your recording come to life. Perfect for voice
                notes, audio messages, or just having fun with sound.
              </p>
            </div>

            <div className='w-full max-w-2xl'>
              {!isGameActive ? (
                  <Card className='p-8'>
                  <CardContent className='space-y-6'>
                    <div className='flex items-center justify-center'>
                      <ImageIcon className='h-16 w-16 text-primary' />
                    </div>
                    <div className='space-y-2'>
                      <h2 className='text-2xl font-bold'>Provide a picture</h2>
                      <p className='text-muted-foreground'>
                        Upload an image and optionally add a prompt. Then start a
                        visual conversation.
                      </p>
                    </div>

                    <div className='space-y-3'>
                      <div>
                        <label className='block text-sm font-medium mb-2'>Image</label>
                        <div
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onClick={triggerFileSelect}
                          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 py-8 text-center transition-colors ${
                            isDragging ? 'border-primary bg-muted/40' : 'border-input hover:bg-muted/20'
                          }`}
                        >
                          <UploadCloud className='h-6 w-6 text-muted-foreground' />
                          <div className='space-y-1'>
                            <p className='text-sm'>Drag and drop an image here</p>
                            <p className='text-xs text-muted-foreground'>or click to browse</p>
                          </div>
                          <input
                            ref={fileInputRef}
                            type='file'
                            accept='image/*'
                            onChange={handleImageChange}
                            className='hidden'
                          />
                        </div>
                        {imageError && (
                          <p className='mt-2 text-sm text-red-600'>{imageError}</p>
                        )}
                      </div>

                      {imagePreviewUrl && selectedImage && (
                        <div className='rounded-md border p-3'>
                          <div className='flex items-start justify-between gap-3'>
                            <div className='flex-1'>
                              <img
                                src={imagePreviewUrl}
                                alt='Selected preview'
                                className='mx-auto max-h-64 rounded-md object-contain'
                              />
                              <div className='mt-3 text-left text-sm text-muted-foreground'>
                                <p className='truncate'>File: <span className='font-medium text-foreground'>{selectedImage.name}</span></p>
                                <p>Size: {(selectedImage.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                            </div>
                            <div className='flex shrink-0 flex-col gap-2'>
                              <Button variant='outline' size='sm' onClick={triggerFileSelect} className='flex items-center gap-2'>
                                <RefreshCcw className='h-4 w-4' />
                                Change
                              </Button>
                              <Button variant='destructive' size='sm' onClick={removeSelectedImage} className='flex items-center gap-2'>
                                <Trash className='h-4 w-4' />
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className='block text-sm font-medium mb-2'>Prompt (optional)</label>
                        <input
                          type='text'
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder='e.g. Ask about the scene, objects, style...'
                          disabled={!selectedImage}
                          className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm disabled:opacity-50'
                        />
                      </div>

                      {submitError && (
                        <p className='text-sm text-red-600'>{submitError}</p>
                      )}
                    </div>

                    <Button
                      onClick={startGame}
                      size='lg'
                      disabled={!selectedImage || isSubmitting}
                      className='w-full px-4 py-4 text-base sm:w-auto sm:px-8 sm:py-6 sm:text-lg'
                    >
                      <Mic className='mr-2 h-4 w-4 sm:h-5 sm:w-5' />
                      <span className='hidden sm:inline'>
                        Start Visual Conversation
                      </span>
                      <span className='sm:hidden'>Start</span>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className='space-y-6'>
                  <AudioRecorder
                    onRecordingComplete={handleRecordingComplete}
                  />

                  {hasRecorded && (
                    <Card className='border-green-200 bg-green-50'>
                      <CardContent className='p-6 text-center'>
                        <div className='space-y-4'>
                          <div className='flex items-center justify-center'>
                            <CheckCircle className='h-12 w-12 text-green-500' />
                          </div>
                          <div className='space-y-2'>
                            <h3 className='text-xl font-bold text-green-800'>
                              Your answer is recorded!
                            </h3>
                            <p className='text-green-600'>
                              Great job! You've successfully recorded your audio
                              in WebM format. You can play it back, download it,
                              or record again.
                            </p>
                          </div>
                          <div className='flex justify-center gap-2'>
                            <Button
                              onClick={resetGame}
                              variant='outline'
                              className='border-green-300 text-green-700 hover:bg-green-100'
                            >
                              Play Again
                            </Button>
                            <Button
                              onClick={resetGame}
                              className='bg-green-600 hover:bg-green-700'
                            >
                              New Recording
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <footer className='border-t py-6 md:py-0'>
        <div className='container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row'>
          <div className='flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0'>
            <p className='text-center text-sm leading-loose text-muted-foreground md:text-left'>
              Audio Voice Mini-Game built with Next.js, Bun, and shadcn/ui.
              <a
                href='https://github.com'
                target='_blank'
                rel='noreferrer'
                className='font-medium underline underline-offset-4'
              >
                GitHub
              </a>
              .
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
