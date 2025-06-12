'use client'

import { Pacifico } from 'next/font/google'

const pacifico = Pacifico({ subsets: ['latin'], weight: '400' })

export default function Footer() {
  return (
    <footer
      style={{
        marginTop: 20,
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        borderTop: '3px solid #6b46c1', // purple border top
        color: '#6b46c1',               // purple text color
        fontSize: 14,
        fontFamily: pacifico.style.fontFamily,
        userSelect: 'none',
        flexWrap: 'wrap',
      }}
    >
      <img
        src="/icons/fairy.png"
        alt="Fairy icon"
        style={{ width: 28, height: 28, display: 'inline-block' }}
      />
      <span>Created by Angela</span>
      <span>© {new Date().getFullYear()} All rights reserved.</span>
    </footer>
  )
}
