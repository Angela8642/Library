'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Auth } from '@supabase/auth-ui-react'
import { supabase } from '@/lib/supabase'
import Header from '../components/Header'
import Footer from '../components/Footer'


const customAppearance = {
  theme: {
    default: {
      colors: {
        brand: '#6b46c1',          // primary purple for buttons/links
        brandAccent: '#4c35a8',    // a darker purple accent
        inputBorder: '#6b46c1',
        inputLabelText: '#6b46c1',
        anchorTextColor: '#6b46c1',
        buttonPrimaryBackground: '#6b46c1',
        buttonPrimaryHoverBackground: '#4c35a8',
      },
      fontFamily: "'Pacifico', cursive",
    }
  }
}

export default function LoginPage() {
  const router = useRouter()

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        router.push('/')
      }
    }

    checkUser()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        router.push('/')
      }
    })

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [router])

  return (
    <div
      style={{
        fontFamily: "'Pacifico', cursive",
        color: '#6b46c1',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Header />
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'calc(100vh - 60px)',
        }}
      >
        <Auth
          supabaseClient={supabase}
          appearance={customAppearance}
          providers={[]}
        />
      </div>
      <Footer />
    </div>
  )
}
