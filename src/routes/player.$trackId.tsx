import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useState, useRef } from 'react'
import { tablesDB, storage, account } from '@/lib/appwrite'
import { ID } from 'appwrite'

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID
const AUDIO_BUCKET_ID = import.meta.env.VITE_APPWRITE_AUDIO_BUCKET_ID

export const Route = createFileRoute('/player/$trackId')({
  beforeLoad: async () => {
    try {
      const user = await account.get()
      return { userId: user.$id }
    } catch {
      throw redirect({ to: '/auth' })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()
  const { trackId } = Route.useParams()
  const { userId } = Route.useRouteContext()
  const [mode, setMode] = useState<'practice' | 'record'>('practice')
  const [showTranscript, setShowTranscript] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement>(null)
  const [speed, setSpeed] = useState(1)

  const {
    data: track,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['track', trackId],
    queryFn: () => tablesDB.getRow(DATABASE_ID, 'tracks', trackId),
  })

  const audioUrl = track
    ? storage
        .getFileView({ bucketId: AUDIO_BUCKET_ID, fileId: track.audioFileId })
        .toString()
    : null

  const saveSession = useMutation({
    mutationFn: () =>
      tablesDB.createRow({
        databaseId: DATABASE_ID,
        tableId: 'sessions',
        rowId: ID.unique(),
        data: {
          userId,
          trackId,
          completedAt: new Date().toISOString(),
        },
      }),
  })

  async function startRecording() {
    setError('')
    chunksRef.current = [] // clear previous chunks
    setRecordingUrl(null) // clear previous recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data)
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setRecordingUrl(url)
        stream.getTracks().forEach((t) => t.stop())
      }

      mediaRecorder.start()
      setRecording(true)
    } catch {
      setError(
        'Microphone access denied. Please allow microphone access to record.',
      )
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  async function handleComplete() {
    await saveSession.mutateAsync()
  }

  function seek(seconds: number) {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(
        0,
        Math.min(
          audioRef.current.duration,
          audioRef.current.currentTime + seconds,
        ),
      )
    }
  }

  function changeSpeed(newSpeed: number) {
    setSpeed(newSpeed)
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed
    }
  }

  if (isLoading)
    return <div className="px-4 py-8 text-sm text-gray-500">Loading...</div>
  if (isError || !track)
    return <div className="px-4 py-8 text-sm text-red-500">Track not found</div>

  return (
    <div className="min-h-screen px-4 py-8 max-w-lg mx-auto">
      <button
        onClick={() => router.history.back()}
        className="text-sm text-gray-500 mb-6 hover:text-black transition-colors"
      >
        ← Back
      </button>

      <div className="mb-6">
        <h1 className="text-xl font-medium">{track.title}</h1>
        <span className="text-xs text-gray-400 capitalize">
          {track.difficulty}
        </span>
      </div>

      {/* Audio player */}
      <div className="mb-6">
        {audioUrl && (
          <audio
            ref={audioRef}
            controls
            loop={mode === 'practice'}
            src={audioUrl}
            className="w-full"
          />
        )}
      </div>

      {mode === 'practice' && (
        <div className="flex gap-2 mb-4">
          {[0.8, 0.9, 1].map((s) => (
            <button
              key={s}
              onClick={() => changeSpeed(s)}
              className={`text-sm border rounded-lg px-3 py-1.5 transition-colors ${
                speed === s
                  ? 'border-black text-black'
                  : 'border-gray-200 text-gray-500 hover:border-gray-400'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      )}

      {mode === 'practice' && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => seek(-5)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-400 transition-colors"
          >
            ← 5s
          </button>
          <button
            onClick={() => seek(-3)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-400 transition-colors"
          >
            ← 3s
          </button>
          <button
            onClick={() => seek(-1)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-400 transition-colors"
          >
            ← 1s
          </button>
          <button
            onClick={() => seek(1)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-400 transition-colors"
          >
            1s →
          </button>
          <button
            onClick={() => seek(3)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-400 transition-colors"
          >
            3s →
          </button>
          <button
            onClick={() => seek(5)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-400 transition-colors"
          >
            5s →
          </button>
        </div>
      )}

      {/* Transcript toggles */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => setShowTranscript((p) => !p)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-400 transition-colors"
        >
          {showTranscript ? 'Hide transcript' : 'Show transcript'}
        </button>
        {track.transcript_translation && (
          <button
            onClick={() => setShowTranslation((p) => !p)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-400 transition-colors"
          >
            {showTranslation ? 'Hide translation' : 'Show translation'}
          </button>
        )}
      </div>

      {showTranscript && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg text-lg leading-relaxed">
          {track.transcript}
        </div>
      )}

      {showTranslation && track.transcript_translation && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg text-sm leading-relaxed text-gray-600">
          {track.transcript_translation}
        </div>
      )}

      {/* Mode */}
      {mode === 'practice' && (
        <button
          onClick={() => setMode('record')}
          className="w-full border border-gray-200 rounded-lg py-2 text-sm hover:border-gray-400 transition-colors mb-3"
        >
          Try recording
        </button>
      )}

      {mode === 'record' && (
        <div className="space-y-3 mb-3">
          <div className="flex gap-3">
            {!recording ? (
              <button
                onClick={startRecording}
                className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-medium"
              >
                Start recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex-1 border border-red-500 text-red-500 rounded-lg py-2 text-sm font-medium"
              >
                Stop recording
              </button>
            )}
          </div>

          {recordingUrl && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Your recording</p>
              <audio controls src={recordingUrl} className="w-full" />
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      )}

      {/* Mark as complete — only available in record mode after recording */}
      {mode === 'record' && recordingUrl && (
        <button
          onClick={handleComplete}
          disabled={saveSession.isPending || saveSession.isSuccess}
          className="w-full bg-black text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
        >
          {saveSession.isPending
            ? 'Saving...'
            : saveSession.isSuccess
              ? 'Session saved'
              : 'Mark as complete'}
        </button>
      )}
    </div>
  )
}
