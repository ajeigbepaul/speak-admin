'use client'
import { useAuth } from '@/hooks/useAuth'
import React from 'react'

const Welcome = () => {
  const { user } = useAuth()

  return (
    <div>
      <h1 className="text-3xl font-bold mb-1 capitalize">Welcome, {user?.name}!</h1>
      <p className="text-muted-foreground">Here's what's happening on your platform today.</p>
    </div>
  )
}

export default Welcome