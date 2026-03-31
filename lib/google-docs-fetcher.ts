/**
 * Utility to fetch content from Google Docs
 *
 * This uses the Google Docs export feature which allows fetching
 * documents as plain text without requiring OAuth when the document
 * is shared publicly or within an organization.
 */

/**
 * Extract the document ID from a Google Docs URL
 */
export function extractDocId(url: string): string | null {
  // Handle various Google Docs URL formats:
  // - https://docs.google.com/document/d/DOCUMENT_ID/edit
  // - https://docs.google.com/document/d/DOCUMENT_ID/edit?usp=sharing
  // - https://docs.google.com/document/d/DOCUMENT_ID

  const patterns = [
    /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/,
    /docs\.google\.com\/document\/u\/\d+\/d\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Fetch the content of a Google Doc as plain text
 */
export async function fetchGoogleDocContent(url: string): Promise<string> {
  const docId = extractDocId(url);

  if (!docId) {
    throw new Error('Invalid Google Docs URL. Could not extract document ID.');
  }

  // Google Docs export URL for plain text
  const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;

  try {
    const response = await fetch(exportUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SprintPlanner/1.0)',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Google Doc not found. Make sure the document exists and is accessible.');
      }
      if (response.status === 403 || response.status === 401) {
        throw new Error('Access denied. Make sure the Google Doc is shared with "Anyone with the link" or your organization.');
      }
      throw new Error(`Failed to fetch Google Doc: ${response.status} ${response.statusText}`);
    }

    const content = await response.text();

    if (!content || content.length < 50) {
      throw new Error('Google Doc appears to be empty or could not be read.');
    }

    return content;
  } catch (error) {
    if (error instanceof Error) {
      // Re-throw our custom errors
      if (error.message.includes('Google Doc')) {
        throw error;
      }
      // Wrap fetch errors
      throw new Error(`Failed to fetch Google Doc: ${error.message}`);
    }
    throw new Error('Failed to fetch Google Doc. Please check the URL and sharing settings.');
  }
}
