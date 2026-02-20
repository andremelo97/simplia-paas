/**
 * Supabase Vector Search Service
 *
 * Provides RAG (Retrieval-Augmented Generation) capabilities using:
 * - OpenAI text-embedding-3-small for embeddings (1536 dimensions)
 * - Supabase PostgreSQL with pgvector for similarity search
 *
 * The knowledge base is global (not per-tenant) and stored in Supabase.
 */

const { createClient } = require('@supabase/supabase-js');

let supabaseClient = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    supabaseClient = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }
  return supabaseClient;
}

/**
 * Generate embedding vector for text using OpenAI
 *
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} 1536-dimension embedding vector
 */
async function embedText(text) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

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
    console.error('[VectorSearch] OpenAI Embeddings API error:', error);
    throw new Error(`Embeddings API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Search for similar documents in the knowledge base
 *
 * @param {string} queryText - User query text
 * @param {Object} options
 * @param {number} [options.matchCount=5] - Number of results to return
 * @param {Object} [options.filter={}] - Metadata filter
 * @returns {Promise<Array<{content: string, metadata: Object, similarity: number}>>}
 */
async function searchDocuments(queryText, { matchCount = 5, filter = {} } = {}) {
  try {
    const embedding = await embedText(queryText);
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_count: matchCount,
      filter: filter
    });

    if (error) {
      console.error('[VectorSearch] Supabase RPC error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[VectorSearch] Search failed, returning empty results:', error.message);
    return [];
  }
}

module.exports = {
  embedText,
  searchDocuments
};
