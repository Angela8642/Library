'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { supabase } from '@/lib/supabase'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function AddBookPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [description, setDescription] = useState('')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setCoverFile(acceptedFiles[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  async function uploadCover(file: File) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const filePath = `covers/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('book-covers')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from('book-covers').getPublicUrl(filePath)
    return data.publicUrl
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let cover_url = null
      if (coverFile) {
        cover_url = await uploadCover(coverFile)
      }

      const { data, error: insertError } = await supabase
        .from('books')
        .insert({
          title,
          author,
          description,
          cover_url,
          title_lowercase: title.toLowerCase(),
        })
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }

      router.push(`/book/${data.id}`)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(String(err))
      }
      setLoading(false)
    }
  }

  const commonFont = { fontFamily: 'Pacifico, cursive', color: '#6b46c1' }

  return (
    <>
      <Header />

      <div
        style={{
          padding: 20,
          maxWidth: 600,
          margin: '0 auto',
          ...commonFont,
        }}
      >
        <h1 style={{ textAlign: 'center', fontSize: 36, marginBottom: 30 }}>
          Add New Book
        </h1>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 20, display: 'block', marginBottom: 6 }}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              style={{
                width: '100%',
                padding: 10,
                borderRadius: 8,
                border: '2px solid #6b46c1',
                fontSize: 18,
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                color: 'inherit',
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 20, display: 'block', marginBottom: 6 }}>
              Author
            </label>
            <input
              type="text"
              value={author}
              onChange={e => setAuthor(e.target.value)}
              required
              style={{
                width: '100%',
                padding: 10,
                borderRadius: 8,
                border: '2px solid #6b46c1',
                fontSize: 18,
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                color: 'inherit',
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 20, display: 'block', marginBottom: 6 }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={5}
              style={{
                width: '100%',
                padding: 10,
                borderRadius: 8,
                border: '2px solid #6b46c1',
                fontSize: 18,
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                color: 'inherit',
              }}
            />
          </div>

          <div
            {...getRootProps()}
            style={{
              border: '2px dashed #6b46c1',
              padding: 30,
              marginTop: 10,
              cursor: 'pointer',
              textAlign: 'center',
              borderRadius: 8,
              fontSize: 18,
              userSelect: 'none',
              fontFamily: 'inherit',
              color: 'inherit',
            }}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p>Drop the file here ...</p>
            ) : (
              <p>Drag / drop a cover image here, or click to select file</p>
            )}
          </div>

          {coverFile && (
            <p style={{ marginTop: 10, fontSize: 16 }}>
              Selected file: <strong>{coverFile.name}</strong>
            </p>
          )}

          {error && (
            <p
              style={{
                color: 'red',
                marginTop: 10,
                fontSize: 16,
                fontFamily: 'Arial, sans-serif',
              }}
            >
              {error}
            </p>
          )}

          <button
            disabled={loading}
            type="submit"
            style={{
              marginTop: 30,
              width: '100%',
              padding: '12px 0',
              backgroundColor: '#6b46c1',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 20,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Pacifico, cursive',
              transition: 'background-color 0.3s ease',
            }}
          >
            {loading ? 'Saving...' : 'Submit'}
          </button>
        </form>
      </div>
      <Footer />
    </>
  )
}
