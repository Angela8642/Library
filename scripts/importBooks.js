import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();



// Supabase config
const SUPABASE_URL = 'https://letrnhdhgtwzdzubveav.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxldHJuaGRoZ3R3emR6dWJ2ZWF2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTE0MjMxOCwiZXhwIjoyMDY0NzE4MzE4fQ.lUp_mo-7VsWCs1gMS3wVxYDK66SLY94qGsRRU0o-NvE';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Google Books config
const GOOGLE_API_KEY = 'AIzaSyDuqptfhJrhr_9YY-XM55D6LK0E1YdhqRw';
const SUBJECT = 'fiction';
const MAX_BOOKS = 200;
const BOOKS_PER_PAGE = 40;

async function fetchBooks(startIndex) {
  const url = `https://www.googleapis.com/books/v1/volumes?q=subject:${SUBJECT}&printType=books&startIndex=${startIndex}&maxResults=${BOOKS_PER_PAGE}&key=${GOOGLE_API_KEY}`;

  const response = await axios.get(url);
  return response.data.items || [];
}

function transformBook(item) {
  const volume = item.volumeInfo;

  return {
    title: volume.title?.trim() || 'Unknown Title',
    author: (volume.authors?.[0] || 'Unknown Author').trim(),
    description: volume.description?.trim() || '',
    cover_url: volume.imageLinks?.thumbnail || '',
    title_lowercase: volume.title?.toLowerCase() || ''
  };
}


async function uploadBooks(books) {
  const { error } = await supabase.from('books').insert(books);

  if (error) {
    console.error('❌ Upload failed:', error.message);
  } else {
    console.log(`✅ Uploaded ${books.length} books`);
  }
}

async function run() {
  let totalFetched = 0;

  while (totalFetched < MAX_BOOKS) {
    const books = await fetchBooks(totalFetched);
    if (!books.length) break;

    const transformed = books.map(transformBook);
    await uploadBooks(transformed);
    totalFetched += books.length;
  }

  console.log('🎉 Done importing books.');
}

run().catch(console.error);
