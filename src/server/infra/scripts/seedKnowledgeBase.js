/**
 * Knowledge Base Seed Script
 *
 * Reads markdown documents from the knowledge-base directory,
 * chunks them into segments, generates embeddings via OpenAI,
 * and inserts into the Supabase `documents` table.
 *
 * Idempotent: clears existing documents and re-inserts.
 *
 * Usage: npm run seed:knowledge-base
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const KNOWLEDGE_BASE_DIR = path.join(__dirname, '../knowledge-base');
const CHUNK_MAX_CHARS = 2000; // ~500 tokens

async function embedText(text) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(`Embeddings API error ${response.status}: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

function chunkText(text, source) {
  const paragraphs = text.split(/\n\n+/);
  const chunks = [];
  let current = '';

  for (const para of paragraphs) {
    if (current.length + para.length > CHUNK_MAX_CHARS && current.length > 0) {
      chunks.push(current.trim());
      current = '';
    }
    current += (current ? '\n\n' : '') + para;
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.map((content, index) => ({
    content,
    metadata: { source, chunk_index: index, language: 'en' }
  }));
}

async function seed() {
  // Validate env
  if (!process.env.OPENAI_API_KEY) {
    console.error('Missing OPENAI_API_KEY');
    process.exit(1);
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Read all .md files
  const files = fs.readdirSync(KNOWLEDGE_BASE_DIR).filter(f => f.endsWith('.md'));
  console.log(`Found ${files.length} knowledge base documents`);

  // Chunk all documents
  const allChunks = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(KNOWLEDGE_BASE_DIR, file), 'utf-8');
    const source = file.replace('.md', '');
    const chunks = chunkText(content, source);
    allChunks.push(...chunks);
    console.log(`  ${file}: ${chunks.length} chunks`);
  }

  console.log(`Total chunks: ${allChunks.length}`);

  // Clear existing documents (idempotent)
  console.log('Clearing existing documents...');
  const { error: deleteError } = await supabase
    .from('documents')
    .delete()
    .gte('id', 0); // Delete all rows

  if (deleteError) {
    // Table might not exist yet — try neq instead
    const { error: deleteError2 } = await supabase
      .from('documents')
      .delete()
      .neq('id', -1);

    if (deleteError2) {
      console.warn('Could not clear documents table:', deleteError2.message);
      console.warn('Make sure the pgvector SQL script has been executed on Supabase.');
    }
  }

  // Generate embeddings and insert
  let inserted = 0;
  for (let i = 0; i < allChunks.length; i++) {
    const chunk = allChunks[i];
    process.stdout.write(`\rEmbedding chunk ${i + 1}/${allChunks.length}...`);

    try {
      const embedding = await embedText(chunk.content);

      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          content: chunk.content,
          metadata: chunk.metadata,
          embedding: embedding
        });

      if (insertError) {
        console.error(`\nFailed to insert chunk ${i + 1}:`, insertError.message);
      } else {
        inserted++;
      }

      // Rate limit: ~3000 RPM for embeddings, small delay to be safe
      if (i % 10 === 9) {
        await new Promise(r => setTimeout(r, 200));
      }
    } catch (error) {
      console.error(`\nFailed to process chunk ${i + 1}:`, error.message);
    }
  }

  console.log(`\nDone! Inserted ${inserted}/${allChunks.length} chunks.`);
}

seed()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
