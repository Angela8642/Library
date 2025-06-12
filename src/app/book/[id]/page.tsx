'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { Pacifico } from 'next/font/google'

const pacifico = Pacifico({ subsets: ['latin'], weight: '400' })

type Book = {
  id: string
  title: string
  author: string
  description: string
  cover_url?: string
}

function StarRatingInput({
  rating,
  onChange,
  disabled,
}: {
  rating: number | null
  onChange: (rating: number) => void
  disabled?: boolean
}) {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <div style={{ display: 'inline-block', cursor: disabled ? 'default' : 'pointer' }}>
      {[1, 2, 3, 4, 5].map(star => {
        const isFilled = hovered !== null ? star <= hovered : rating !== null ? star <= rating : false
        return (
          <span
            key={star}
            onClick={() => !disabled && onChange(star)}
            onMouseEnter={() => !disabled && setHovered(star)}
            onMouseLeave={() => !disabled && setHovered(null)}
            style={{
              color: isFilled ? '#f5a623' : '#ccc',
              fontSize: 24,
              userSelect: 'none',
              transition: 'color 0.2s',
            }}
            aria-label={`${star} Star`}
            role="button"
            tabIndex={disabled ? -1 : 0}
            onKeyDown={e => {
              if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                onChange(star)
              }
            }}
          >
            ★
          </span>
        )
      })}
    </div>
  )
}

export default function BookDetailPage() {
  const router = useRouter()
  const { id } = useParams() as { id: string }
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [score, setScore] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError('')

      const { data: userData } = await supabase.auth.getUser()
      const currentUserId = userData.user?.id ?? null
      setUserId(currentUserId)

      const { data: bookData, error: bookError } = await supabase
        .from('books')
        .select('*')
        .eq('id', id)
        .single()

      if (bookError) {
        setError(bookError.message)
        setLoading(false)
        return
      }

      setBook(bookData)

      if (currentUserId) {
        const { data: ratingData, error: ratingError } = await supabase
          .from('user_books')
          .select('score, comment')
          .eq('user_id', currentUserId)
          .eq('book_id', id)
          .single()

        if (ratingError && ratingError.code !== 'PGRST116') {
          setError(ratingError.message)
          setLoading(false)
          return
        }

        setScore(ratingData?.score ?? null)
        setComment(ratingData?.comment ?? '')
      }

      setLoading(false)
    }

    fetchData()
  }, [id])

  async function handleSave(newScore: number, newComment: string) {
    if (!userId) return

    setSaving(true)
    setError('')

    try {
      const { error: upsertError } = await supabase
        .from('user_books')
        .upsert(
          {
            user_id: userId,
            book_id: id,
            score: newScore,
            comment: newComment,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,book_id' }
        )

      if (upsertError) {
        setError(upsertError.message)
      } else {
        setScore(newScore)
        setComment(newComment)
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(String(err))
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p>Loading...</p>
  if (error) return <p style={{ color: 'red' }}>{error}</p>
  if (!book) return <p>Book not found</p>

  return (
    <>
      <Header />

            <div style={{ padding: '20px' }}>
       <button
          onClick={() => router.back()}
          style={{
            fontFamily: "'Pacifico', cursive",
            backgroundColor: 'transparent',
            border: 'none',
            color: '#6b46c1',
            cursor: 'pointer',
            fontSize: 20,
            padding: '4px 8px',
            marginBottom: 16,
          }}
        >
          Back
        </button>

        <h1
          style={{
            fontFamily: pacifico.style.fontFamily,
            fontSize: 24,
            fontWeight: 'bold',
            color: '#6b46c1',
            textAlign: 'center',
            margin: '20px 0',
            userSelect: 'none',
          }}
        >
          {book.title}
        </h1>
        <p style={{ textAlign: 'center', fontStyle: 'italic', color: '#444' }}>
          by {book.author}
        </p>
        {book.cover_url && (
          <img
            src={book.cover_url}
            alt={`${book.title} cover`}
            style={{ maxWidth: 200, borderRadius: 8, display: 'block', margin: '20px auto' }}
          />
        )}
        <p style={{ maxWidth: 600, margin: '20px auto', lineHeight: 1.5 }}>{book.description}</p>

        {userId ? (
          <>
            <div
              style={{
                maxWidth: 600,
                margin: '20px auto',
                textAlign: 'center',
              }}
            >
              <label style={{ display: 'block', marginBottom: 8 }}>Your Rating:</label>
              <StarRatingInput
                rating={score}
                onChange={newRating => {
                  if (!saving) {
                    handleSave(newRating, comment)
                  }
                }}
                disabled={saving}
              />
            </div>

            <div
              style={{
                maxWidth: 600,
                margin: '20px auto',
                textAlign: 'center',
              }}
            >
              <label style={{ display: 'block', marginBottom: 8 }}>Your Comment:</label>
             <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={2}
              disabled={saving}
              onBlur={() => {
                if (score !== null) handleSave(score, comment)
              }}
              placeholder="Write your comment here..."
              style={{
                width: '100%',
                marginTop: 8,
                padding: '10px',
                textAlign: 'center',     
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                lineHeight: '1.5',
                borderRadius: '6px',
                fontFamily: 'inherit',
              }}
            />

            </div>
          </>
        ) : (
          <p style={{ textAlign: 'center', fontStyle: 'italic' }}>
            Login to rate and comment this book.
          </p>
        )}
      </div>
<Footer />
    </>
  )
}
