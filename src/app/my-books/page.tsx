'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Header from '../components/Header'
import Footer from '../components/Footer'

type BookWithScore = {
  id: string
  title: string
  author: string
  description: string
  cover_url?: string
  score: number | null
  comment?: string | null
}

function StarRating({ rating }: { rating: number | null }) {
  const maxStars = 5
  const filledStars = rating ? Math.round(rating) : 0
  const stars = []

  for (let i = 1; i <= maxStars; i++) {
    stars.push(
      <span key={i} style={{ color: i <= filledStars ? '#f5a623' : '#ccc', fontSize: 18 }}>
        ★
      </span>
    )
  }

  return (
    <span>
      {stars}
      {rating !== null && (
        <span style={{ color: '#000', marginLeft: 6, fontWeight: '600', fontSize: 14 }}>
          ({rating.toFixed(1).replace(/\.0$/, '')})
        </span>
      )}
    </span>
  )
}

export default function MyBooksPage() {
  const [books, setBooks] = useState<BookWithScore[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [updatingBookId, setUpdatingBookId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Dynamically load Pacifico font
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap'
    link.rel = 'stylesheet'
    document.head.appendChild(link)

    async function fetchBooks() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUserId(user.id)

      const { data, error } = await supabase
        .from('user_books')
        .select('score, comment, book:books(id, title, author, description, cover_url)')
        .eq('user_id', user.id)

      if (error) {
        console.error('Error fetching user books:', error)
        setBooks([])
      } else if (data) {
        const booksWithScore = data
          .filter(item => item.book !== null)
          .map(item => {
            const bookData = Array.isArray(item.book) ? item.book[0] : item.book

            return {
              id: bookData.id,
              title: bookData.title,
              author: bookData.author,
              description: bookData.description,
              cover_url: bookData.cover_url,
              score: item.score,
              comment: item.comment,
            }
          })
        setBooks(booksWithScore)
      }

      setLoading(false)
    }

    fetchBooks()
  }, [router])

  async function handleRemoveBook(bookId: string) {
    if (!userId) return
    setUpdatingBookId(bookId)

    const { error } = await supabase
      .from('user_books')
      .delete()
      .eq('user_id', userId)
      .eq('book_id', bookId)

    if (error) {
      console.error('Error removing book:', error)
    } else {
      setBooks(prev => prev.filter(book => book.id !== bookId))
    }

    setUpdatingBookId(null)
  }

  if (loading) return <p>Loading your favorite books...</p>

  return (
    <>
      <Header />
      <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto' }}>
        {/* Centered Title */}
        <h1
          style={{
            textAlign: 'center',
            fontSize: '2.5rem',
            fontWeight: '400',
            color: '#6b46c1',
            marginBottom: 30,
            fontFamily: "'Pacifico', cursive",
            textShadow: '1px 1px 4px rgba(107, 70, 193, 0.5)',
            userSelect: 'none',
          }}
        >
          My Books
        </h1>

        {/* Styled Add Button */}
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <button
            onClick={() => router.push('/')}
            style={{
              backgroundColor: '#805ad5',
              color: 'white',
              fontWeight: '600',
              fontSize: 16,
              padding: '12px 24px',
              borderRadius: 30,
              border: 'none',
              boxShadow: '0 4px 10px rgba(128, 90, 213, 0.3)',
              cursor: 'pointer',
              transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
              userSelect: 'none',
            }}
            onMouseEnter={e => {
              ;(e.currentTarget.style.backgroundColor = '#6b46c1')
              ;(e.currentTarget.style.boxShadow = '0 6px 14px rgba(107, 70, 193, 0.5)')
            }}
            onMouseLeave={e => {
              ;(e.currentTarget.style.backgroundColor = '#805ad5')
              ;(e.currentTarget.style.boxShadow = '0 4px 10px rgba(128, 90, 213, 0.3)')
            }}
          >
            Add More to Favorites
          </button>
        </div>

        {books.length === 0 ? (
          <p style={{ textAlign: 'center', fontSize: 18, color: '#666' }}>
            No favorite books found.
          </p>
        ) : (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 20,
              justifyContent: 'center',
            }}
          >
            {books.map(book => (
              <div
                key={book.id}
                style={{
                  width: 200,
                  border: '1px solid #ccc',
                  borderRadius: 8,
                  padding: 10,
                  position: 'relative',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s ease',
                }}
                onClick={() => router.push(`/book/${book.id}`)}
                onMouseEnter={e => {
                  ;(e.currentTarget.style.transform = 'scale(1.05)')
                  ;(e.currentTarget.style.boxShadow = '0 4px 12px rgba(107, 70, 193, 0.3)')
                }}
                onMouseLeave={e => {
                  ;(e.currentTarget.style.transform = 'scale(1)')
                  ;(e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.1)')
                }}
              >
                {book.cover_url && (
                  <img
                    src={book.cover_url}
                    alt={`${book.title} cover`}
                    style={{
                      width: '100%',
                      height: 250,
                      objectFit: 'cover',
                      borderRadius: 4,
                    }}
                  />
                )}
                <h3
                  style={{
                    margin: '10px 0 5px 0',
                    fontWeight: '700',
                    color: '#333',
                  }}
                >
                  {book.title}
                </h3>
                <p
                  style={{
                    color: '#666',
                    margin: '0 0 5px 0',
                    fontStyle: 'italic',
                  }}
                >
                  {book.author}
                </p>
                <p
                  style={{
                    fontSize: 14,
                    color: '#444',
                    height: 40,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginBottom: 8,
                  }}
                >
                  {book.description}
                </p>

                <StarRating rating={book.score} />

                {book.comment && book.comment.trim() !== '' && (
                  <p
                    style={{
                      fontStyle: 'italic',
                      fontSize: 13,
                      color: '#555',
                      marginTop: 'auto',
                    }}
                  >
                    &ldquo;{book.comment}&rdquo;
                  </p>
                )}

                <button
                  onClick={e => {
                    e.stopPropagation() // prevent navigating to book page on remove click
                    handleRemoveBook(book.id)
                  }}
                  disabled={updatingBookId === book.id}
                  aria-label="Remove from favorites"
                  title="Remove from favorites"
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 24,
                    color: 'red',
                    userSelect: 'none',
                  }}
                >
                  ❤️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  )
}
