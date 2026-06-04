/**
 * Utility functions for chunking text, calculating similarity scores, and local storage.
 */

// Splits a long answer into manageable word/phrase chunks for assembly in Stage 1
// It respects key blanks as cohesive chunks, respects comma pauses, and groups remaining words securely.
export function generateWordChunks(text: string, blanks: string[] = []): string[] {
  const cleanedText = text.replace(/\s+/g, ' ').trim();
  
  if (!blanks || blanks.length === 0) {
    return fallbackPhraseChunker(cleanedText);
  }

  // Find all active, non-empty blanks that actually reside in the text
  const validBlanks = blanks
    .map(b => b.trim())
    .filter(b => b.length > 0 && cleanedText.includes(b));

  if (validBlanks.length === 0) {
    return fallbackPhraseChunker(cleanedText);
  }

  interface Interval {
    start: number;
    end: number;
    text: string;
  }

  const intervals: Interval[] = [];

  // Record boundaries of valid blanks in the full text
  for (const blank of validBlanks) {
    let index = cleanedText.indexOf(blank);
    while (index !== -1) {
      const overlaps = intervals.some(
        inv => (index >= inv.start && index < inv.end) || 
               (index + blank.length > inv.start && index + blank.length <= inv.end)
      );

      if (!overlaps) {
        intervals.push({
          start: index,
          end: index + blank.length,
          text: blank
        });
      }
      index = cleanedText.indexOf(blank, index + 1);
    }
  }

  // Sort intervals left-to-right
  intervals.sort((a, b) => a.start - b.start);

  const chunks: string[] = [];
  let currentPos = 0;

  for (const inv of intervals) {
    // Process the non-blank text prefix before this blank phrase
    if (inv.start > currentPos) {
      const sliceText = cleanedText.substring(currentPos, inv.start).trim();
      if (sliceText) {
        chunks.push(...fallbackPhraseChunker(sliceText));
      }
    }
    // Append the important blank phrase itself as a single unified piece
    chunks.push(inv.text);
    currentPos = inv.end;
  }

  // Process any leftover trailing text
  if (currentPos < cleanedText.length) {
    const sliceText = cleanedText.substring(currentPos).trim();
    if (sliceText) {
      chunks.push(...fallbackPhraseChunker(sliceText));
    }
  }

  return chunks.map(c => c.trim()).filter(c => c.length > 0);
}

// Fallback chunker when blanks are not available or for segments between blanks
function fallbackPhraseChunker(text: string): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  
  // Split on natural clause boundaries like commas if present to maintain flow
  if (cleaned.includes(',')) {
    const parts = cleaned.split(',');
    const results: string[] = [];
    parts.forEach((part, idx) => {
      let segment = part.trim();
      if (idx < parts.length - 1) {
        segment += ',';
      }
      if (segment) {
        results.push(...chunkWordsLarger(segment));
      }
    });
    return results;
  }

  return chunkWordsLarger(cleaned);
}

// Group space-separated words into larger, natural 3-4 word phrase blocks
function chunkWordsLarger(text: string): string[] {
  const words = text.split(' ').filter(w => w.length > 0);
  if (words.length <= 4) {
    return [text];
  }

  const chunks: string[] = [];
  let index = 0;

  while (index < words.length) {
    const remaining = words.length - index;
    let size = 3; // Keep default cluster to 3 words
    
    if (remaining === 4) {
      size = 4;
    } else if (remaining === 5) {
      size = 3;
    } else if (remaining <= 3) {
      size = remaining;
    }

    const phrase = words.slice(index, index + size).join(' ');
    chunks.push(phrase);
    index += size;
  }

  return chunks;
}

// Compute the similarity score between two Korean strings
// Uses a combination of Longest Common Subsequence (LCS) ratio and character set intersection to be extremely forgiving of typos while enforcing correctness
export function calculateSimilarity(str1: string, str2: string): number {
  const clean1 = str1.replace(/[^a-zA-Z0-9가-힣]/g, '').toLowerCase();
  const clean2 = str2.replace(/[^a-zA-Z0-9가-힣]/g, '').toLowerCase();
  
  if (!clean1 && !clean2) return 100;
  if (!clean1 || !clean2) return 0;
  if (clean1 === clean2) return 100;
  
  // Levenshtein / Edit Distance based similarity
  const m = clean1.length;
  const n = clean2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (clean1[i - 1] === clean2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
      }
    }
  }
  
  const distance = dp[m][n];
  const maxLen = Math.max(m, n);
  const similarity = Math.round(((maxLen - distance) / maxLen) * 100);
  
  return Math.max(0, Math.min(100, similarity));
}

// Check if answer matches roughly (over 85% matches or exact matches ignoring spacing)
export function isCorrectAnswer(userAns: string, actualAns: string): boolean {
  const clean1 = userAns.replace(/\s+/g, '').replace(/[^a-zA-Z0-9가-힣]/g, '');
  const clean2 = actualAns.replace(/\s+/g, '').replace(/[^a-zA-Z0-9가-힣]/g, '');
  
  if (clean1 === clean2) return true;
  return calculateSimilarity(userAns, actualAns) >= 85;
}
