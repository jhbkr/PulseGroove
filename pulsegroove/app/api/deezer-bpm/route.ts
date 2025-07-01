import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const track = req.nextUrl.searchParams.get('track');
  const artist = req.nextUrl.searchParams.get('artist');
  if (!track || !artist) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  // Recherche Deezer
  const searchUrl = `https://api.deezer.com/search?q=track:"${encodeURIComponent(track)}" artist:"${encodeURIComponent(artist)}"`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();
  if (!searchData.data || searchData.data.length === 0) {
    return NextResponse.json({ bpm: null });
  }
  const deezerTrackId = searchData.data[0].id;
  const trackUrl = `https://api.deezer.com/track/${deezerTrackId}`;
  const trackRes = await fetch(trackUrl);
  const trackData = await trackRes.json();
  return NextResponse.json({ bpm: trackData.bpm || null });
} 