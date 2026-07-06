# Demo fixtures

Each folder is one curated demo video. The video files themselves are not
committed; add them locally before running the live pipeline.

Layout per fixture:

```
<slug>/
  video.mp4              local only (gitignored). Download the clip manually.
  audio.m4a | audio.wav  optional, local only. Extracted from video when absent.
  caption.txt            the post caption, committed.
  booking.cached.json    committed. Schema-valid Booking JSON used by
                         PIPELINE_MODE=cached and as the auto-mode fallback.
```

Adding a clip:

1. Create a folder with a new slug and drop in `video.mp4` + `caption.txt`.
2. Add every URL form of the post (full link and share short-link) to
   `manifest.json` mapping to the slug. Keys are normalized on load, so paste
   them exactly as shared from the app.
3. Run the live pipeline once (`PIPELINE_MODE=live`), verify the Booking JSON,
   and save it as `booking.cached.json`. Check the meeting point pin on a map
   before trusting it.

The demo URLs currently in `manifest.json` are placeholders for the curated
Kuching clips. Replace them with the real post URLs when the clips are chosen;
`GET /fixtures` feeds the app's demo shortcuts from this manifest, so nothing
else needs updating.
