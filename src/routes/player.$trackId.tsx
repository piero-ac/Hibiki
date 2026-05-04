import {
  createFileRoute,
  redirect,
  useRouter,
  useNavigate,
} from '@tanstack/react-router'
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
      return { userId: user.$id, isAnonymous: !user.email }
    } catch {
      throw redirect({ to: '/auth' })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const router = useRouter()
  const { trackId } = Route.useParams()
  const { userId, isAnonymous } = Route.useRouteContext()
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
  const [timer, setTimer] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [rating, setRating] = useState<number | null>(null)
  const [loop, setLoop] = useState(true)
  const navigate = useNavigate()

  const {
    data: track,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['track', trackId],
    queryFn: () =>
      tablesDB.getRow({
        databaseId: DATABASE_ID,
        tableId: 'tracks',
        rowId: trackId,
      }),
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
          rating,
          trackTitle: track?.title,
        },
      }),
  })

  async function startRecording() {
    setError('')
    chunksRef.current = [] // clear previous chunks
    setRecordingUrl(null) // clear previous recording
    setRating(null)
    startTimer()
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
    stopTimer()
  }

  async function handleComplete() {
    try {
      if (isAnonymous) {
        const existing = JSON.parse(
          localStorage.getItem('hibiki-sessions') ?? '[]',
        )
        const newSession = {
          id: crypto.randomUUID(),
          trackId,
          trackTitle: track?.title,
          rating,
          duration: track?.duration,
          completedAt: new Date().toISOString(),
        }
        localStorage.setItem(
          'hibiki-sessions',
          JSON.stringify([newSession, ...existing]),
        )
      } else {
        await saveSession.mutateAsync()
      }
      window.confirm('🎉 Session complete! Your attempt has been saved.')
      navigate({ to: '/history' })
    } catch {
      window.alert(
        'Something went wrong saving your session. Please try again.',
      )
    }
  }

  function startTimer() {
    setTimer(0)
    timerRef.current = setInterval(() => {
      setTimer((t) => t + 1)
    }, 1000)
  }

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
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
    return (
      <div className="min-h-screen bg-steel-200">
        <div className="max-w-lg mx-auto px-4 py-8 text-sm text-steel-500">
          Loading...
        </div>
      </div>
    )

  if (isError || !track)
    return (
      <div className="min-h-screen bg-steel-200">
        <div className="max-w-lg mx-auto px-4 py-8 text-sm text-red-500">
          Track not found
        </div>
      </div>
    )

  return (
    <div className="min-h-screen bg-steel-200">
      <div className="max-w-lg mx-auto px-4 py-8">
        <button
          onClick={() => router.history.back()}
          className="text-sm text-steel-500 mb-6 hover:text-steel-800 transition-colors"
        >
          ← Back
        </button>

        {/* Track info */}
        <div className="mb-6">
          <h1 className="text-xl font-medium text-steel-800">{track.title}</h1>
          <span className="text-xs text-steel-500 capitalize">
            {track.difficulty}
          </span>
        </div>

        {/* Audio player */}
        <div className="bg-steel-50 border border-steel-300 rounded-xl p-4 mb-4">
          {audioUrl && (
            <audio
              ref={audioRef}
              controls
              loop={loop}
              src={audioUrl}
              className="w-full mb-3"
            />
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setLoop((p) => !p)}
              className={`text-xs border rounded-lg px-3 py-1.5 transition-colors ${
                loop
                  ? 'border-steel-700 text-steel-700 bg-steel-100'
                  : 'border-steel-300 text-steel-500 hover:border-steel-500'
              }`}
            >
              {loop ? 'Loop on' : 'Loop off'}
            </button>

            {mode === 'practice' &&
              [0.8, 0.9, 1].map((s) => (
                <button
                  key={s}
                  onClick={() => changeSpeed(s)}
                  className={`text-xs border rounded-lg px-3 py-1.5 transition-colors ${
                    speed === s
                      ? 'border-steel-700 text-steel-700 bg-steel-100'
                      : 'border-steel-300 text-steel-500 hover:border-steel-500'
                  }`}
                >
                  {s}x
                </button>
              ))}
          </div>
        </div>

        {/* Seek buttons */}
        {mode === 'practice' && (
          <div className="flex gap-2 mb-4 flex-wrap">
            {[-5, -3, -1, 1, 3, 5].map((s) => (
              <button
                key={s}
                onClick={() => seek(s)}
                className="text-xs border border-steel-300 text-steel-600 rounded-lg px-3 py-1.5 hover:border-steel-500 transition-colors"
              >
                {s > 0 ? `${s}s →` : `← ${Math.abs(s)}s`}
              </button>
            ))}
          </div>
        )}

        {/* Transcript */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setShowTranscript((p) => !p)}
            className="text-xs border border-steel-300 text-steel-600 rounded-lg px-3 py-1.5 hover:border-steel-500 transition-colors"
          >
            {showTranscript ? 'Hide transcript' : 'Show transcript'}
          </button>
          {track.transcript_translation && (
            <button
              onClick={() => setShowTranslation((p) => !p)}
              className="text-xs border border-steel-300 text-steel-600 rounded-lg px-3 py-1.5 hover:border-steel-500 transition-colors"
            >
              {showTranslation ? 'Hide translation' : 'Show translation'}
            </button>
          )}
        </div>

        {showTranscript && (
          <div className="mb-4 p-4 bg-steel-50 border border-steel-200 rounded-xl text-base leading-relaxed text-steel-800">
            {track.transcript}
          </div>
        )}

        {showTranslation && track.transcript_translation && (
          <div className="mb-4 p-4 bg-steel-50 border border-steel-200 rounded-xl text-sm leading-relaxed text-steel-600">
            {track.transcript_translation}
          </div>
        )}

        {/* Mode switcher */}
        {mode === 'practice' && (
          <button
            onClick={() => setMode('record')}
            className="w-full bg-steel-50 border border-steel-300 rounded-xl py-2.5 text-sm text-steel-700 hover:border-steel-500 hover:bg-white transition-colors mb-3"
          >
            Try recording
          </button>
        )}

        {/* Record mode */}
        {mode === 'record' && (
          <div className="space-y-3 mb-3">
            <div className="flex gap-3 items-center">
              {!recording ? (
                <button
                  onClick={startRecording}
                  className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-medium"
                >
                  Start recording
                </button>
              ) : (
                <>
                  <button
                    onClick={stopRecording}
                    className="flex-1 border border-red-400 text-red-500 rounded-xl py-2.5 text-sm font-medium"
                  >
                    Stop recording
                  </button>
                  <p className="text-sm text-red-500 font-medium tabular-nums">
                    {Math.floor(timer / 60)
                      .toString()
                      .padStart(2, '0')}
                    :{(timer % 60).toString().padStart(2, '0')}
                  </p>
                </>
              )}
            </div>

            {recordingUrl && (
              <div className="bg-steel-50 border border-steel-200 rounded-xl p-4">
                <p className="text-xs text-steel-500 mb-2">Your recording</p>
                <audio controls src={recordingUrl} className="w-full" />

                <div className="mt-4">
                  <p className="text-xs text-steel-500 mb-2">
                    Rate your attempt
                  </p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((r) => (
                      <button
                        key={r}
                        onClick={() => setRating(r)}
                        className={`flex-1 py-2 text-sm border rounded-lg transition-colors ${
                          rating === r
                            ? 'border-steel-700 text-steel-700 bg-steel-100 font-medium'
                            : 'border-steel-300 text-steel-500 hover:border-steel-500'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )}

        {/* Mark as complete */}
        {mode === 'record' && recordingUrl && (
          <button
            onClick={handleComplete}
            disabled={!rating || saveSession.isPending || saveSession.isSuccess}
            className="w-full bg-steel-800 text-steel-50 rounded-xl py-2.5 text-sm font-medium disabled:opacity-50"
          >
            {saveSession.isPending
              ? 'Saving...'
              : saveSession.isSuccess
                ? 'Session saved'
                : 'Mark as complete'}
          </button>
        )}
      </div>
    </div>
  )
}
