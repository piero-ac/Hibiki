import { createFileRoute, Link, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { tablesDB, storage, account } from '@/lib/appwrite'
import { ID } from 'appwrite'

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID
const AUDIO_BUCKET_ID = import.meta.env.VITE_APPWRITE_AUDIO_BUCKET_ID

export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    try {
      const user = await account.get()
      if (!user.labels.includes('admin')) throw redirect({ to: '/' })
    } catch (e) {
      if (e instanceof Response) throw e
      throw redirect({ to: '/auth' })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState('Japanese')
  const [difficulty, setDifficulty] = useState('beginner')
  const [category, setCategory] = useState('interview')
  const [duration, setDuration] = useState('')
  const [source, setSource] = useState('')
  const [transcript, setTranscript] = useState('')
  const [transcriptTranslation, setTranscriptTranslation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!audioFile) {
      setError('Please select an audio file')
      return
    }
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const uploaded = await storage.createFile({
        bucketId: AUDIO_BUCKET_ID,
        fileId: ID.unique(),
        file: audioFile,
      })

      await tablesDB.createRow({
        databaseId: DATABASE_ID,
        tableId: 'tracks',
        rowId: ID.unique(),
        data: {
          audioFileId: uploaded.$id,
          title,
          language,
          difficulty,
          category,
          duration: parseInt(duration),
          source: source || null,
          transcript,
          transcript_translation: transcriptTranslation || null,
        },
      })

      setSuccess(true)
      setAudioFile(null)
      setTitle('')
      setDuration('')
      setSource('')
      setTranscript('')
      setTranscriptTranslation('')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-steel-200">
      <div className="max-w-lg mx-auto px-4 py-8">
        <h1 className="text-lg font-medium text-steel-800 mb-6">
          Upload Track
        </h1>

        <div className="bg-steel-50 border border-steel-300 rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs uppercase tracking-wide text-steel-600 mb-1">
                Audio File
              </label>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                className="w-full text-xs text-steel-600"
                required
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-steel-600 mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-steel-300 rounded-lg px-3 py-2 text-sm bg-white text-steel-800 outline-none focus:border-steel-600"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-wide text-steel-600 mb-1">
                  Language
                </label>
                <input
                  type="text"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full border border-steel-300 rounded-lg px-3 py-2 text-sm bg-white text-steel-800 outline-none focus:border-steel-600"
                  required
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-steel-600 mb-1">
                  Duration (s)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full border border-steel-300 rounded-lg px-3 py-2 text-sm bg-white text-steel-800 outline-none focus:border-steel-600"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs uppercase tracking-wide text-steel-600 mb-1">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full border border-steel-300 rounded-lg px-3 py-2 text-sm bg-white text-steel-800 outline-none focus:border-steel-600"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-steel-600 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-steel-300 rounded-lg px-3 py-2 text-sm bg-white text-steel-800 outline-none focus:border-steel-600"
                >
                  <option value="interview">Interview</option>
                  <option value="podcast">Podcast</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-steel-600 mb-1">
                Source URL
              </label>
              <input
                type="url"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full border border-steel-300 rounded-lg px-3 py-2 text-sm bg-white text-steel-800 outline-none focus:border-steel-600"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-steel-600 mb-1">
                Transcript
              </label>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                rows={3}
                className="w-full border border-steel-300 rounded-lg px-3 py-2 text-sm bg-white text-steel-800 outline-none focus:border-steel-600 resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wide text-steel-600 mb-1">
                Translation
              </label>
              <textarea
                value={transcriptTranslation}
                onChange={(e) => setTranscriptTranslation(e.target.value)}
                rows={3}
                className="w-full border border-steel-300 rounded-lg px-3 py-2 text-sm bg-white text-steel-800 outline-none focus:border-steel-600 resize-none"
              />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}
            {success && (
              <p className="text-xs text-green-600">
                Track uploaded successfully
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-steel-800 text-steel-50 rounded-lg py-2.5 text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Upload Track'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
