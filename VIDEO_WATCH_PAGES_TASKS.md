# Video watch pages — tasks

Search Console reports our blog videos as **"Video isn't on a watch page"**
(https://support.google.com/webmasters/answer/9495631#indexing_status).
Google only indexes a video when the page's main purpose is that single video.

## Cause (verified)

- Each of the 9 videos sits inside a long article, so the video is secondary content.
- The pre-rendered post HTML contains **no video at all**: the page shell is
  rendered with the generic "Tax Calculator Blog" heading and the post body
  (with the `<iframe>`) is fetched by the browser after load.

## Design (my call)

One dedicated page per video at `/watch/<slug>` (slug = the post's slug):
video player first, at full width, present in the pre-rendered HTML; H1 =
video title; a short description; `VideoObject` JSON-LD; a link to the full
article. In the article, the inline player is replaced by a thumbnail card that
links to the watch page, so the article no longer competes as a "video page".

## Tasks

- [ ] 1. `scripts/maintain_blog_index.py`: read `{{youtube:ID}}` from each post, add `videoId` to `index.json`, write `frontend/src/content/videos.json`, add `/watch/<slug>` URLs and `<video:video>` entries to `sitemap.xml`.
- [ ] 2. `WatchPage` + `/watch/:slug` route; pre-render every watch page (`includedRoutes` in `vite.config.ts`).
- [ ] 3. Replace the inline iframe in articles with a thumbnail card linking to the watch page.
- [ ] 4. Tests: Jest for `WatchPage` (player first, JSON-LD, unknown slug), pytest for the script.
- [ ] 5. Build, check the pre-rendered HTML for iframe + JSON-LD, then deploy (needs approval).
- [ ] 6. After deploy: Search Console → URL Inspection on a `/watch/...` URL → Request indexing; re-validate the "Video isn't on a watch page" issue.

## Open

- Video upload dates are taken from the post date (not the YouTube upload date).
- Titles/descriptions come from the post title and excerpt.
