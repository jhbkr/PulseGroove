import { NextRequest, NextResponse } from "next/server";

const DEEZER_SEARCH = "https://api.deezer.com/search";
const DEEZER_TRACK  = "https://api.deezer.com/track";

export async function GET(req: NextRequest) {
  const track  = req.nextUrl.searchParams.get("track");
  const artist = req.nextUrl.searchParams.get("artist");
  if (!track || !artist) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 });
  }

  /* ---------- 1) Deezer -------------------------------------------------- */
  try {
    const q   = `${DEEZER_SEARCH}?q=track:"${encodeURIComponent(
      track,
    )}" artist:"${encodeURIComponent(artist)}"&limit=1`;
    const res = await fetch(q);
    const js  = await res.json();
    const id  = js?.data?.[0]?.id;
    if (id) {
      const dz  = await fetch(`${DEEZER_TRACK}/${id}`).then((r) => r.json());
      if (dz?.bpm && dz.bpm > 0) {
        return NextResponse.json({ bpm: dz.bpm, source: "deezer" }, { status: 200 });
      }
    }
  } catch (_) {}

  /* ---------- 2) GetSongBPM --------------------------------------------- */
  const gsbKey = process.env.GETSONGBPM_API_KEY;
  if (gsbKey) {
    try {
      const url = `https://api.getsongbpm.com/?api_key=${gsbKey}&type=song&lookup=${encodeURIComponent(
        `${track} ${artist}`,
      )}`;
      const gsb = await fetch(url).then((r) => r.json());
      const bpm = gsb?.song?.tempo ?? gsb?.search?.[0]?.tempo;
      if (bpm) {
        return NextResponse.json(
          { bpm: Number(bpm), source: "getsongbpm" },
          { status: 200 },
        );
      }
    } catch (_) {}
  }

  /* ---------- 3) TheAudioDB --------------------------------------------- */
  try {
    const tadbKey = process.env.THEAUDIODB_API_KEY ?? "2";
    const tadbUrl = `https://theaudiodb.com/api/v1/json/${tadbKey}/searchtrack.php?s=${encodeURIComponent(
      artist,
    )}&t=${encodeURIComponent(track)}`;
    const tadb = await fetch(tadbUrl).then((r) => r.json());
    const bpm  = tadb?.track?.[0]?.intTempo;
    if (bpm) {
      return NextResponse.json(
        { bpm: Number(bpm), source: "theaudiodb" },
        { status: 200 },
      );
    }
  } catch (_) {}

  return NextResponse.json({ bpm: null, source: null }, { status: 404 });
}
