import { supabase } from './supabaseClient'

export function subscribeRoom(roomId: string, onRoom: (row: any) => void) {
  return supabase
    .channel(`room-${roomId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
      (payload) => onRoom(payload.new)
    )
    .subscribe()
}

export function subscribePlayers(roomId: string, onPlayers: (rows: any[]) => void) {
  const channel = supabase
    .channel(`players-${roomId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` },
      async () => {
        const { data } = await supabase
          .from('players')
          .select('*')
          .eq('room_id', roomId)
          .order('joined_at', { ascending: true })
        onPlayers(data || [])
      }
    )
    .subscribe()

  // initial fetch (so you have data before the first realtime event fires)
  supabase
    .from('players')
    .select('*')
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true })
    .then(({ data }) => onPlayers(data || []))

  return channel
}
