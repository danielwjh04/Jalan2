# Demo fixtures

Each folder is one curated demo post. The video files themselves are not
committed; add them locally before running the live pipeline.

Layout per fixture:

```
<slug>/
  video.mp4              local only (gitignored). Download or build the clip.
  audio.m4a | audio.wav  optional, local only. Extracted from video when absent.
  caption.txt            the post caption, committed.
  booking.cached.json    committed. Schema-valid Booking JSON used by
                         PIPELINE_MODE=cached and as the auto-mode fallback.
  trip.cached.json       optional prepared multi-stop TripPlan.
  cover.jpg              optional curated offline cover.
```

`menu/<slug>/` contains the menu-board demo image and its structured cached
menu. Dish rows include normalized 0..999 bounding boxes so the app can
highlight the exact source row. Cached menu data must not claim that a dish
photo, taste, allergen or pronunciation was verified at the stall.

Adding or refreshing a clip:

1. Create a folder with a new slug and drop in `video.mp4` + `caption.txt`.
2. Add every URL form of the post (full link and share short-link) to
   `manifest.json` mapping to the slug. Keys are normalized on load, so paste
   them exactly as shared from the app.
3. Run the live pipeline once (`PIPELINE_MODE=live`), verify the Booking JSON,
   and save it as `booking.cached.json`. Check the meeting point pin on a map
   before trusting it.

The manifest holds the real curated Kuching posts for the demo. The committed
`booking.cached.json` files are caption-derived fallbacks until the live
pipeline can be run with provider keys and saved back over the cached files.
