'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useSupabaseAuth() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function ensureSession() {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        await supabase.auth.signInAnonymously() // requires toggle ON in dashboard
      }
      if (!cancelled) setReady(true)
    }
    ensureSession()
    return () => { cancelled = true }
  }, [])

  return ready
}
