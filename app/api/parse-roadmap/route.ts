import { NextRequest, NextResponse } from 'next/server';
import { parseRoadmap, parseRoadmapFromPdf } from '@/lib/roadmap-parser';
import { fetchGoogleDocContent } from '@/lib/google-docs-fetcher';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // Handle PDF file upload via multipart/form-data
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
      }
      const arrayBuffer = await file.arrayBuffer();
      const pdfBase64 = Buffer.from(arrayBuffer).toString('base64');
      const extraction = await parseRoadmapFromPdf(pdfBase64);
      return NextResponse.json({ extraction });
    }

    const body = await request.json();
    const { content, url } = body;

    let roadmapContent: string;

    // If URL is provided, fetch the content from Google Docs
    if (url) {
      // Validate it's a Google Docs URL
      if (!url.includes('docs.google.com')) {
        return NextResponse.json(
          { error: 'Only Google Docs URLs are supported.' },
          { status: 400 }
        );
      }

      try {
        roadmapContent = await fetchGoogleDocContent(url);
      } catch (fetchError) {
        const message = fetchError instanceof Error ? fetchError.message : 'Failed to fetch document';
        return NextResponse.json({ error: message }, { status: 400 });
      }
    } else if (content) {
      roadmapContent = content;
    } else {
      return NextResponse.json(
        { error: 'Please provide either a Google Docs URL or paste the roadmap content.' },
        { status: 400 }
      );
    }

    // Validate content
    if (typeof roadmapContent !== 'string') {
      return NextResponse.json(
        { error: 'Invalid roadmap content.' },
        { status: 400 }
      );
    }

    if (roadmapContent.length < 100) {
      return NextResponse.json(
        { error: 'Roadmap content seems too short. Please provide the full roadmap document.' },
        { status: 400 }
      );
    }

    if (roadmapContent.length > 150000) {
      return NextResponse.json(
        {
          error:
            'Roadmap content is too long (max 150,000 characters). The document may need to be shortened.',
        },
        { status: 400 }
      );
    }

    // Parse the roadmap using Claude
    const extraction = await parseRoadmap(roadmapContent);

    return NextResponse.json({ extraction });
  } catch (error) {
    console.error('Error parsing roadmap:', error);

    const message = error instanceof Error ? error.message : 'Failed to parse roadmap';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
