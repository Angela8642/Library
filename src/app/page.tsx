'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import Header from './components/Header'
import Footer from './components/Footer'

type Book = {
  id: string
  title: string
  author: string
  description: string
  cover_url?: string
  commentText?: string
}

const ADMIN_EMAILS = ['angela.vaczi@gmail.com', 'tijl.ivens@gmail.com']

export default function HomePage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [authorFilter, setAuthorFilter] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userBooks, setUserBooks] = useState<Record<string, number | null>>({})
  const [updatingBookId, setUpdatingBookId] = useState<string | null>(null)
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)

      const { data: userData } = await supabase.auth.getUser()
      const currentUserId = userData.user?.id ?? null
      const currentUserEmail = userData.user?.email ?? null
      setUserId(currentUserId)
      setUserEmail(currentUserEmail)

      const { data: booksData, error: booksError } = await supabase.from('books').select('*')
      if (booksError || !booksData) {
        console.error('Error fetching books:', booksError)
        setBooks([])
        setLoading(false)
        return
      }

      const { data: commentsData } = await supabase
        .from('user_books')
        .select('book_id, comment')

      const commentMap = new Map<string, string>()
      commentsData?.forEach(({ book_id, comment }) => {
        if (comment) {
          const existing = commentMap.get(book_id) || ''
          commentMap.set(book_id, existing + ' ' + comment.toLowerCase())
        }
      })

      const booksWithComments = booksData.map(book => ({
        ...book,
        commentText: commentMap.get(book.id) || '',
      }))

      setBooks(booksWithComments)

      if (currentUserId) {
        const { data: userBooksData } = await supabase
          .from('user_books')
          .select('book_id, score')
          .eq('user_id', currentUserId)

        const scoreMap: Record<string, number | null> = {}
        userBooksData?.forEach(({ book_id, score }) => {
          scoreMap[book_id] = score
        })
        setUserBooks(scoreMap)
      }

      setLoading(false)
    }

    fetchData()
  }, [])

  function renderStars(score: number | null) {
    if (!score) return null
    const fullStars = '★'.repeat(score)
    const emptyStars = '☆'.repeat(5 - score)
    return (
      <p style={{ fontSize: 18, marginTop: 6, color: '#f5b301' }}>
        {fullStars}
        {emptyStars}
      </p>
    )
  }

  async function handleAddBook(bookId: string) {
    if (!userId) return
    setUpdatingBookId(bookId)

    await supabase
      .from('user_books')
      .upsert(
        {
          user_id: userId,
          book_id: bookId,
          score: null,
          comment: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,book_id' }
      )

    setUserBooks(prev => ({ ...prev, [bookId]: null }))
    setUpdatingBookId(null)
  }

  async function handleRemoveBook(bookId: string) {
    if (!userId) return
    setUpdatingBookId(bookId)

    await supabase
      .from('user_books')
      .delete()
      .eq('user_id', userId)
      .eq('book_id', bookId)

    setUserBooks(prev => {
      const copy = { ...prev }
      delete copy[bookId]
      return copy
    })
    setUpdatingBookId(null)
  }

  async function handleDeleteBook(bookId: string) {
    const isAdmin = userEmail ? ADMIN_EMAILS.includes(userEmail) : false
    if (!isAdmin) return

    setDeletingBookId(bookId)

    await supabase.from('books').delete().eq('id', bookId)
    await supabase.from('user_books').delete().eq('book_id', bookId)

    setBooks(prev => prev.filter(book => book.id !== bookId))
    setUserBooks(prev => {
      const copy = { ...prev }
      delete copy[bookId]
      return copy
    })

    setDeletingBookId(null)
  }

  const filteredBooks = books.filter(book => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      book.title.toLowerCase().includes(searchLower) ||
      book.author.toLowerCase().includes(searchLower) ||
      (book.commentText && book.commentText.includes(searchLower))

    const matchesAuthor = authorFilter ? book.author === authorFilter : true

    return matchesSearch && matchesAuthor
  })

  const uniqueAuthors = Array.from(new Set(books.map(book => book.author))).sort()

  if (loading) return <p>Loading books...</p>

  const isAdmin = userEmail ? ADMIN_EMAILS.includes(userEmail) : false

  return (
    <>
      <Header />

      <div style={{ padding: 20, textAlign: 'center' }}>

        {isAdmin && (
          <Link href="/add-book" style={{ textDecoration: 'underline', color: 'blue' }}>
            + Add New Book
          </Link>
        )}

        {/* SEARCH BAR */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
          <input
            type="text"
            placeholder="Search by title, author, or comment"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 14px',
              width: '50%',
              borderRadius: '20px',
              border: '1px solid #ccc',
              fontSize: 14,
              outline: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          />
        </div>

        {/* FILTER DROPDOWN */}
        <div style={{ marginTop: 20, textAlign: 'left' }}>
          <label
            style={{
              marginRight: 8,
              fontSize: 14,
              fontFamily: 'Pacifico, cursive',
              color: '#6b46c1', 
            }}
          >
            Filter by Author:
          </label>

          <select
            value={authorFilter}
            onChange={e => setAuthorFilter(e.target.value)}
            style={{
              padding: '4px 8px',
              fontSize: 13,
              borderRadius: 4,
              backgroundColor: '#fff',
              fontFamily: 'Pacifico, cursive',
              minWidth: '40px',
              maxWidth: '100%',
              color: '#6b46c1', 
            }}
          >
            <option value="">All</option>
            {uniqueAuthors.map(author => (
              <option key={author} value={author}>
                {author}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 20,
            marginTop: 30,
          }}
        >
          {filteredBooks.length === 0 && <p>No books found.</p>}

          {filteredBooks.map(book => {
            const isFavorited = userBooks.hasOwnProperty(book.id)
            const userScore = userBooks[book.id]

            return (
              <div
                key={book.id}
                style={{
                  width: 200,
                  border: '1px solid #ccc',
                  borderRadius: 12,
                  padding: 12,
                  position: 'relative',
                  textAlign: 'center',
                }}
              >
                <Link
                  href={`/book/${book.id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  {book.cover_url && (
                    <Image
                      src={book.cover_url}
                      alt={`${book.title} cover`}
                      width={180}
                      height={240}
                      style={{ objectFit: 'cover', borderRadius: 8 }}
                      priority
                    />
                  )}
                  <h3 style={{ fontSize: 18, margin: '10px 0 4px' }}>{book.title}</h3>
                  <p style={{ color: '#666', fontSize: 14 }}>{book.author}</p>
                </Link>

                {renderStars(userScore)}

                {userId && (
                  <button
                    onClick={() =>
                      isFavorited ? handleRemoveBook(book.id) : handleAddBook(book.id)
                    }
                    disabled={updatingBookId === book.id}
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 24,
                      color: isFavorited ? 'red' : 'gray',
                    }}
                    title={isFavorited ? 'Remove from My Books' : 'Add to My Books'}
                  >
                    {isFavorited ? '❤️' : '🤍'}
                  </button>
                )}

                {isAdmin && (
                  <button
                    onClick={() => handleDeleteBook(book.id)}
                    disabled={deletingBookId === book.id}
                    style={{
                      position: 'absolute',
                      bottom: 10,
                      right: 10,
                      backgroundColor: 'red',
                      border: 'none',
                      color: 'white',
                      borderRadius: 4,
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    {deletingBookId === book.id ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <Footer />
      </div>
    </>
  )
}
