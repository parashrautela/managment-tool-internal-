import type { Project } from '../types/workspace';

/**
 * Resolves a Project from various link formats:
 * - Full URL: https://example.com/?invite=sample-1&role=client
 * - Query string: ?invite=WEB or invite=sample-1
 * - Project ID: sample-1, proj-acme
 * - Project Key: WEB, APP, DS
 * - Project Name: Website redesign (case-insensitive)
 */
export function resolveProjectFromInvite(input: string, projectsList: Project[]): Project | null {
  const trimmed = (input || '').trim();
  if (!trimmed) return null;

  // 1. Try URL parsing (full URL or relative query)
  try {
    let urlToParse = trimmed;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      if (trimmed.startsWith('/') || trimmed.startsWith('?')) {
        urlToParse = `https://dummy.domain${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
      } else if (trimmed.includes('?')) {
        urlToParse = `https://dummy.domain/${trimmed}`;
      }
    }
    
    if (urlToParse.startsWith('http://') || urlToParse.startsWith('https://')) {
      const parsedUrl = new URL(urlToParse);
      const inviteId = parsedUrl.searchParams.get('invite') || 
                       parsedUrl.searchParams.get('projectId') || 
                       parsedUrl.searchParams.get('project');
      if (inviteId) {
        const found = projectsList.find(
          p => p.id.toLowerCase() === inviteId.toLowerCase() || p.key.toLowerCase() === inviteId.toLowerCase()
        );
        if (found) return found;
      }
      const segments = parsedUrl.pathname.split('/').filter(Boolean);
      const lastSegment = segments[segments.length - 1];
      if (lastSegment) {
        const found = projectsList.find(
          p => p.id.toLowerCase() === lastSegment.toLowerCase() || p.key.toLowerCase() === lastSegment.toLowerCase()
        );
        if (found) return found;
      }
    }
  } catch {
    // Fallback
  }

  // 2. Direct query param fallback (e.g. invite=sample-1)
  const queryMatch = trimmed.match(/(?:invite|projectId|project)=([a-zA-Z0-9_-]+)/i);
  if (queryMatch && queryMatch[1]) {
    const found = projectsList.find(
      p => p.id.toLowerCase() === queryMatch[1].toLowerCase() || p.key.toLowerCase() === queryMatch[1].toLowerCase()
    );
    if (found) return found;
  }

  // 3. Clean string without '#' or leading whitespace
  const clean = trimmed.replace(/^#/, '');

  // 4. Exact or case-insensitive match on ID
  const byId = projectsList.find(p => p.id.toLowerCase() === clean.toLowerCase() || p.id.toLowerCase() === trimmed.toLowerCase());
  if (byId) return byId;

  // 5. Exact or case-insensitive match on Key
  const byKey = projectsList.find(p => p.key.toLowerCase() === clean.toLowerCase() || p.key.toLowerCase() === trimmed.toLowerCase());
  if (byKey) return byKey;

  // 6. Case-insensitive match on Name
  const byName = projectsList.find(p => p.name.toLowerCase() === clean.toLowerCase() || p.name.toLowerCase() === trimmed.toLowerCase());
  if (byName) return byName;

  // 7. Resilient match: strip 'proj-' prefix if user entered just the numbers/letters or vice versa
  const normalizedClean = clean.toLowerCase().replace(/^proj-/, '');
  const byNormalized = projectsList.find(p => {
    const pIdNorm = p.id.toLowerCase().replace(/^proj-/, '');
    return pIdNorm === normalizedClean || p.key.toLowerCase() === normalizedClean;
  });
  if (byNormalized) return byNormalized;

  // 8. Partial / substring match on Name (if query is at least 3 characters)
  if (clean.length >= 3) {
    const cleanLower = clean.toLowerCase();
    const bySubstring = projectsList.find(
      p => p.name.toLowerCase().includes(cleanLower) || p.id.toLowerCase().includes(cleanLower)
    );
    if (bySubstring) return bySubstring;
  }

  return null;
}

