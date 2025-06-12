'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { Pacifico } from 'next/font/google'

const pacifico = Pacifico({ subsets: ['latin'], weight: '400' })

type Book = {
  id: string
  title: string
  author: string
  description: string
  cover_url?: string
  averageScore?: number
}

function StarRating({ rating }: { rating: number }) {
  const maxStars = 5
  const filledStars = Math.round(rating)
  const stars = []

  for (let i = 1; i <= maxStars; i++) {
    stars.push(
      <span key={i} style={{ color: i <= filledStars ? '#f5a623' : '#ccc', fontSize: 20 }}>
        ★
      </span>
    )
  }

  return <div>{stars}</div>
}

export default function PopularPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBooksAndScores() {
      setLoading(true)

      const { data: booksData, error: booksError } = await supabase.from('books').select('*')

      if (booksError || !booksData) {
        console.error('Error fetching books:', booksError)
        setBooks([])
        setLoading(false)
        return
      }

      const { data: scoresData, error: scoresError } = await supabase
        .from('user_books')
        .select('book_id, score')

      if (scoresError) {
        console.error('Error fetching scores:', scoresError)
      }

      const scoreSumMap = new Map<string, number>()
      const scoreCountMap = new Map<string, number>()

      scoresData?.forEach(({ book_id, score }) => {
        if (score !== null) {
          scoreSumMap.set(book_id, (scoreSumMap.get(book_id) || 0) + score)
          scoreCountMap.set(book_id, (scoreCountMap.get(book_id) || 0) + 1)
        }
      })

      const booksWithScores = booksData.map(book => {
        const totalScore = scoreSumMap.get(book.id) || 0
        const count = scoreCountMap.get(book.id) || 0
        const averageScore = count > 0 ? totalScore / count : 0
        return {
          ...book,
          averageScore,
        }
      })

      booksWithScores.sort((a, b) => (b.averageScore ?? 0) - (a.averageScore ?? 0))

      setBooks(booksWithScores)
      setLoading(false)
    }

    fetchBooksAndScores()
  }, [])

  if (loading) return <p>Loading popular books...</p>

  return (
    <>
      <Header />

      <div style={{ padding: 20 }}>
        {/* Styled title */}
        <h1
          style={{
            fontFamily: pacifico.style.fontFamily,
            fontSize: 24,
            fontWeight: 'bold',
            color: '#6b46c1',
            textAlign: 'center',
            marginBottom: 20,
            userSelect: 'none',
          }}
        >
          Popular Books
        </h1>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 20,
            marginTop: 20,
            justifyContent: 'center',
          }}
        >
          {books.length === 0 && <p>No books found.</p>}

          {books.map(book => (
            <div
              key={book.id}
              style={{
                width: 200,
                border: '1px solid #ccc',
                borderRadius: 8,
                padding: 10,
              }}
            >
              <Link href={`/book/${book.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                {book.cover_url && (
                  <Image
                    src={book.cover_url}
                    alt={`${book.title} cover`}
                    width={180}
                    height={240}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                    priority
                  />
                )}
                <h3>{book.title}</h3>
                <p style={{ color: '#666' }}>{book.author}</p>
              </Link>

              <div style={{ marginTop: 8 }}>
                <StarRating rating={book.averageScore ?? 0} />
                <small style={{ color: '#666' }}>
                  {book.averageScore ? book.averageScore.toFixed() : 'No ratings yet'} / 5
                </small>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  )
}
