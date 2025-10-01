// src/components/SetupScreen.tsx
'use client'
import React, { useState } from 'react'
import PlayerTile from './PlayerTile'
import PlayerEditorModal from './PlayerEditorModal'
import ThemeTile from './ThemeTile'
import ThemeEditorModal from './ThemeEditorModal'
import ImposterHintToggle from './ImposterHintToggle'
import ThemeHintToggle from './ThemeHintToggle'
import { supabase } from '../lib/supabaseClient'
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'

type SetupScreenProps = {
  numPlayers: number
  setNumPlayers: (n: number) => void
  localNames: string[]
  setLocalNames: (names: string[]) => void
  allThemes: string[]
  specialThemes: string[]
  selectedThemes: string[]
  toggleTheme: (theme: string) => void
  startGame: () => void
  imposterGetsHint: boolean
  setImposterGetsHint: (v: boolean) => void
  themeHintEnabled: boolean
  setThemeHintEnabled: (v: boolean) => void
}

export default function SetupScreen({
  numPlayers,
  setNumPlayers,
  localNames,
  setLocalNames,
  allThemes,
  specialThemes,
  selectedThemes,
  toggleTheme,
  startGame,
  imposterGetsHint,
  setImposterGetsHint,
  setThemeHintEnabled,
  themeHintEnabled,
}: SetupScreenProps) {
  const [showPlayerEditor, setShowPlayerEditor] = useState(false)
  const [showThemeEditor, setShowThemeEditor] = useState(false)

  // Online (beta) state
  const authReady = useSupabaseAuth()
  const [onlineBusy, setOnlineBusy] = useState(false)

  const hostOnlineGame = async () => {
    try {
      setOnlineBusy(true)
      // ensure we have a session (useSupabaseAuth should have handled this)
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        await supabase.auth.signInAnonymously()
      }

      const hostName = (prompt('Your name?') || 'Host').trim()
      const { data, error } = await supabase.rpc('create_room', { host_name: hostName })
      if (error) throw error

      const row = Array.isArray(data) ? data[0] : null
      const roomCode = row?.room_code
      if (!roomCode) throw new Error('Room code missing from response')

      const link = `${window.location.origin}/r/${roomCode}`
      alert(`Room created!\n\nCode: ${roomCode}\nShare link: ${link}`)
      // Navigate to the room page (create /app/r/[code]/page.tsx when ready)
      window.location.assign(`/r/${roomCode}`)
    } catch (e: any) {
      alert(`Failed to create room:\n${e?.message || e}`)
    } finally {
      setOnlineBusy(false)
    }
  }

  const joinOnlineGame = async () => {
    try {
      setOnlineBusy(true)
      const codeInput = (prompt('Enter room code') || '').trim().toUpperCase()
      if (!codeInput) return
      const playerName = (prompt('Your name?') || 'Player').trim()

      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        await supabase.auth.signInAnonymously()
      }

      const { error } = await supabase.rpc('join_room', {
        room_code: codeInput,
        player_name: playerName,
      })
      if (error) throw error

      alert(`Joined room ${codeInput}!`)
      window.location.assign(`/r/${codeInput}`)
    } catch (e: any) {
      alert(`Failed to join room:\n${e?.message || e}`)
    } finally {
      setOnlineBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-100 to-gray-200 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="imposter-title text-3xl sm:text-4xl">Minposter</h1>
          <p className="imposter-subtitle"></p>
        </div>

        {/* Players Section */}
        <div
          className="card p-4 sm:p-6 cursor-pointer hover:shadow-md transition"
          onClick={() => setShowPlayerEditor(true)}
        >
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold">Players ({numPlayers})</h2>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem' }}>
            {Array.from({ length: numPlayers }).map((_, i) => (
              <PlayerTile
                key={i}
                name={localNames[i] || `Player ${i + 1}`}
                onClick={() => setShowPlayerEditor(true)}
              />
            ))}
          </div>
        </div>

        {/* Theme Section */}
        <div
          className="card p-4 sm:p-6 cursor-pointer hover:shadow-md transition"
          onClick={() => setShowThemeEditor(true)}
        >
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold">Themes</h2>
          </div>

          {/* Only show default themes here */}
          <ThemeTile
            selectedThemes={selectedThemes}
            allThemes={allThemes}
            specialThemes={specialThemes} // hide special packs on main screen
            onClick={() => setShowThemeEditor(true)}
          />
        </div>

        {/* Hint Toggles */}
        <div className="card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ImposterHintToggle
              imposterGetsHint={imposterGetsHint}
              setImposterGetsHint={setImposterGetsHint}
            />
            <ThemeHintToggle
              themeHintEnabled={themeHintEnabled}
              setThemeHintEnabled={setThemeHintEnabled}
            />
          </div>
        </div>

        {/* Online (beta) */}
        <div className="card p-4 sm:p-6">
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold">Online (beta)</h2>
            {!authReady && <p className="text-sm text-gray-500 mt-1">Connecting to Supabase…</p>}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={hostOnlineGame}
              disabled={!authReady || onlineBusy}
              className="start-game-button disabled:opacity-60"
            >
              {onlineBusy ? 'Working…' : 'Host Online Game'}
            </button>

            <button
              onClick={joinOnlineGame}
              disabled={!authReady || onlineBusy}
              className="start-game-button disabled:opacity-60"
            >
              {onlineBusy ? 'Working…' : 'Join Online Game'}
            </button>
          </div>

          <p className="text-center text-xs text-gray-500 mt-3">
            You’ll get a 4-letter code and a shareable link (e.g. /r/ABCD).
          </p>
        </div>

        {/* Start Game (local) */}
        <div className="text-center">
          <button
            onClick={startGame}
            className="start-game-button"
          >
            Start Game
          </button>
        </div>
      </div>

      {/* Modals */}
      {showPlayerEditor && (
        <PlayerEditorModal
          numPlayers={numPlayers}
          localNames={localNames}
          setLocalNames={setLocalNames}
          setNumPlayers={setNumPlayers}
          onClose={() => setShowPlayerEditor(false)}
        />
      )}

      {showThemeEditor && (
        <ThemeEditorModal
          allThemes={allThemes}
          selectedThemes={selectedThemes}
          specialThemes={specialThemes} // pass special themes here
          toggleTheme={toggleTheme}
          onClose={() => setShowThemeEditor(false)}
        />
      )}
    </div>
  )
}
