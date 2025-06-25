'use client'

import { motion } from 'framer-motion'
import { ChatInterface } from '@/components/ChatInterface'
import { UpdateNotification } from '@/components/UpdateNotification'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <UpdateNotification />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ChatInterface />
      </motion.div>
    </div>
  )
} 