'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { FiBookOpen } from 'react-icons/fi'
import { Pacifico } from 'next/font/google'

const pacifico = Pacifico({ subsets: ['latin'], weight: '400' })

export default function Header() {
  const [user, setUser] = useState<{ email: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchUser() {
      const { data } = await supabase.auth.getUser()
      const email = data.user?.email
      if (email) setUser({ email })
    }

    fetchUser()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user?.email
      setUser(email ? { email } : null)
    })

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px',
        borderBottom: '3px solid #6b46c1', // Purple border line
        position: 'relative',
        height: 60,
        fontFamily: pacifico.style.fontFamily,
        color: '#6b46c1',
        userSelect: 'none',
      }}
    >
      {/* Left side navigation */}
      <nav style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <Link
          href="/"
          style={{
            textDecoration: 'none',
            fontWeight: 'bold',
            color: '#6b46c1',
            cursor: 'pointer',
          }}
        >
          Home
        </Link>

        <Link
          href="/popular"
          style={{
            textDecoration: 'none',
            color: '#6b46c1',
            cursor: 'pointer',
          }}
        >
          Popular
        </Link>

        {user && (
          <Link
            href="/my-books"
            style={{
              textDecoration: 'none',
              color: '#6b46c1',
              cursor: 'pointer',
            }}
          >
            My Books
          </Link>
        )}
      </nav>

      {/* Centered title with icon */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontWeight: 'bold',
          fontSize: 24,
          color: '#6b46c1',
          cursor: 'default',
          userSelect: 'none',
        }}
      >
        <FiBookOpen size={28} />
        Bookflow
      </div>

      {/* Right side login/logout */}
      <div>
        {!user ? (
          <Link
            href="/login"
            style={{
              textDecoration: 'none',
              padding: '6px 16px',
              backgroundColor: '#6b46c1',
              color: 'white',
              borderRadius: 8,
              fontFamily: pacifico.style.fontFamily,
              fontWeight: 'normal',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'background-color 0.3s',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#9f7aea')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#6b46c1')}
          >
            Login
          </Link>
        ) : (
          <button
            onClick={handleLogout}
            style={{
              padding: '6px 16px',
              backgroundColor: '#6b46c1',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontFamily: pacifico.style.fontFamily,
              fontWeight: 'normal',
              userSelect: 'none',
              transition: 'background-color 0.3s',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#9f7aea')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#6b46c1')}
          >
            Logout
          </button>
        )}
      </div>
    </header>
  )
}
