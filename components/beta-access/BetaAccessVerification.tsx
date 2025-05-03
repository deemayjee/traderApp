'use client'

import { useState, useEffect } from 'react'
import { BetaAccessService } from '@/lib/services/beta-access'
import { useRouter } from 'next/navigation'

export default function BetaAccessVerification() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const isValid = await BetaAccessService.getInstance().verifyAccessCode(code)
      
      if (isValid) {
        setSuccess('✅ Access code verified! Redirecting...')
        // Set cookie using document.cookie
        document.cookie = 'betaAccessVerified=true; path=/; max-age=2592000' // 30 days
        setTimeout(() => {
          router.push('/')
        }, 1500) // Give time to show success message
      } else {
        setError('❌ Invalid or already used access code. Please try another code.')
      }
    } catch (err) {
      setError('❌ An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isMounted) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md opacity-0 translate-y-5 animate-fade-in-up">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-500 rounded-full mx-auto mb-4 flex items-center justify-center scale-0 animate-scale-in">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Pally Beta Access
            </h2>
            <p className="text-gray-300">
              Enter your 4-digit access code to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                maxLength={4}
                pattern="[0-9]{4}"
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter code"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                {code.length}/4
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-900/20 p-3 rounded-lg opacity-0 animate-fade-in">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-400 text-sm text-center bg-green-900/20 p-3 rounded-lg opacity-0 animate-fade-in">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : 'Verify Access Code'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
} 