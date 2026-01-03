// API route to fetch RSS feeds (proxy to avoid CORS)
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const feedUrl = searchParams.get('url');

    if (!feedUrl) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    // Fetch RSS feed
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AI Tool Box Bot/1.0)',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS: ${response.statusText}`);
    }

    const xml = await response.text();
    
    // Parse RSS XML (simple parsing - for production, use a proper RSS parser)
    const items: any[] = [];
    const itemMatches = xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi);
    
    for (const match of itemMatches) {
      const itemXml = match[1];
      const titleMatch = itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const linkMatch = itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
      const pubDateMatch = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i);
      const descriptionMatch = itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
      const contentMatch = itemXml.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i);
      const authorMatch = itemXml.match(/<dc:creator[^>]*>([\s\S]*?)<\/dc:creator>/i) || 
                         itemXml.match(/<author[^>]*>([\s\S]*?)<\/author>/i);
      const enclosureMatch = itemXml.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="([^"]+)"[^>]*>/i);

      if (titleMatch && linkMatch) {
        items.push({
          title: titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim(),
          link: linkMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim(),
          pubDate: pubDateMatch ? pubDateMatch[1].trim() : undefined,
          content: descriptionMatch ? descriptionMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : undefined,
          'content:encoded': contentMatch ? contentMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : undefined,
          author: authorMatch ? authorMatch[1].trim() : undefined,
          enclosure: enclosureMatch ? {
            url: enclosureMatch[1],
            type: enclosureMatch[2],
          } : undefined,
        });
      }
    }

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RSS feed' },
      { status: 500 }
    );
  }
}

