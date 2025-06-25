'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChatInterface } from '@/components/ChatInterface'
import { LevelSelection } from '@/components/LevelSelection'
import { LessonInterface } from '@/components/LessonInterface'
import { UpdateNotification } from '@/components/UpdateNotification'

type AppMode = 'level-selection' | 'chat' | 'lesson'

export default function Home() {
  const [mode, setMode] = useState<AppMode>('level-selection')
  const [selectedLevel, setSelectedLevel] = useState<string>('')
  const [selectedLesson, setSelectedLesson] = useState<string>('')

  const handleLevelSelect = (level: string) => {
    setSelectedLevel(level)
    setMode('chat')
  }

  const handleLessonSelect = (lesson: string) => {
    setSelectedLesson(lesson)
    setMode('lesson')
  }

  const handleBackToLevels = () => {
    setMode('level-selection')
    setSelectedLevel('')
    setSelectedLesson('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <UpdateNotification />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        {mode === 'level-selection' && (
          <LevelSelection onLevelSelect={handleLevelSelect} />
        )}
        
        {mode === 'chat' && (
          <ChatInterface 
            onBack={handleBackToLevels}
            onLessonSelect={handleLessonSelect}
          />
        )}
        
        {mode === 'lesson' && (
          <LessonInterface 
            level={selectedLevel}
            onBack={() => setMode('chat')}
          />
        )}
      </motion.div>
    </div>
  )
} 