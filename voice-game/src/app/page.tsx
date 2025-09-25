'use client'

import {  Mic, Gamepad2, Menu, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ConversationInterface } from '@/components/ConversationInterface'


export default function Home() {
  const [isGameActive, setIsGameActive] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isWelcomeAudioPlaying, setIsWelcomeAudioPlaying] = useState(false)
  const [welcomeAudioPath, setWelcomeAudioPath] = useState<string | null>(null)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [isWelcomeAudioComplete, setIsWelcomeAudioComplete] = useState(false)
  const [isInstructionsSkipped, setIsInstructionsSkipped] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)


  const generateWelcomeAudio = async () => {
    setIsGeneratingAudio(true)
    try {
      const response = await fetch('/api/game/start', {
        method: 'POST',
      })
      
      if (response.ok) {
        const data = await response.json()
        setWelcomeAudioPath(data.audioPath)
      } else {
        console.error('Failed to generate welcome audio')
      }
    } catch (error) {
      console.error('Error generating welcome audio:', error)
    } finally {
      setIsGeneratingAudio(false)
    }
  }

  const startGame = async () => {
    setIsGameActive(true)
    if (!welcomeAudioPath) {
      await generateWelcomeAudio()
    }
  }

  const playWelcomeAudio = () => {
    if (audioRef.current && welcomeAudioPath) {
      audioRef.current.loop = false
      audioRef.current.play()
      setIsWelcomeAudioPlaying(true)
    }
  }

  const stopWelcomeAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsWelcomeAudioPlaying(false)
      setIsWelcomeAudioComplete(true)
    }
  }

  const skipInstructions = () => {
    stopWelcomeAudio()
    setIsInstructionsSkipped(true)
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

  useEffect(() => {
    if (welcomeAudioPath && isGameActive && !isWelcomeAudioPlaying) {
      playWelcomeAudio()
    }
  }, [welcomeAudioPath, isGameActive])

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    }
  }, [])

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
                  Voice Recording
                </span>
                <span className='text-muted-foreground'>Mini-Game</span>
              </h1>
              <p className='max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8'>
                Have a conversation with AI using your voice! Record audio messages
                and receive intelligent responses
              </p>
            </div>

            <div className='w-full max-w-2xl'>
              {!isGameActive ? (
                <Card className='p-8'>
                  <CardContent className='space-y-6'>
                    <div className='flex items-center justify-center'>
                      <Mic className='h-16 w-16 text-primary' />
                    </div>
                    <div className='space-y-2'>
                      <h2 className='text-2xl font-bold'>Ready to Chat?</h2>
                      <p className='text-muted-foreground'>
                        Click the button below to start a voice conversation with AI.
                        You'll be able to record messages and receive intelligent responses.
                      </p>
                    </div>
                    <Button
                      onClick={startGame}
                      size='lg'
                      disabled={isGeneratingAudio}
                      className='w-full px-4 py-4 text-base sm:w-auto sm:px-8 sm:py-6 sm:text-lg'
                    >
                      <Mic className='mr-2 h-4 w-4 sm:h-5 sm:w-5' />
                      {isGeneratingAudio ? (
                        <span>Generating Audio...</span>
                      ) : (
                        <>
                          <span className='hidden sm:inline'>
                            Start Voice Chat
                          </span>
                          <span className='sm:hidden'>Start Chat</span>
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className='space-y-6'>
                  {/* Welcome Audio Status */}
                  {welcomeAudioPath && (
                    <Card className='border-blue-200 bg-blue-50'>
                      <CardContent className='p-6'>
                        <div className='space-y-4'>
                          <div className='space-y-2'>
                            <h3 className='text-lg font-semibold text-blue-800'>
                              Game Instructions
                            </h3>
                            <p className='text-blue-600 text-sm'>
                              {isInstructionsSkipped
                                ? 'Instructions skipped! You can now start recording.'
                                : isWelcomeAudioPlaying 
                                  ? 'Listen to the game rules and instructions...' 
                                  : isWelcomeAudioComplete 
                                    ? 'Instructions complete! You can now start recording.'
                                    : 'Loading game instructions...'
                              }
                            </p>
                          </div>
                          {!isWelcomeAudioComplete && !isInstructionsSkipped && (
                            <div className='flex justify-center'>
                              <Button
                                onClick={skipInstructions}
                                variant='outline'
                                size='sm'
                                className='border-blue-300 text-blue-700 hover:bg-blue-100'
                              >
                                Skip Instructions
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Hidden Audio Element */}
                  {welcomeAudioPath && (
                    <audio
                      ref={audioRef}
                      src={welcomeAudioPath}
                      preload='auto'
                      onEnded={() => {
                        setIsWelcomeAudioPlaying(false)
                        setIsWelcomeAudioComplete(true)
                      }}
                      onError={() => {
                        setIsWelcomeAudioPlaying(false)
                        setIsWelcomeAudioComplete(true)
                      }}
                    />
                  )}

                  <ConversationInterface
                    disabled={!isWelcomeAudioComplete && !isInstructionsSkipped}
                  />
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
              AI Voice Conversation built with Next.js, Bun, and shadcn/ui.
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
