# SecondShelf build status

26 October 2026. Built against PRD revision 1.2, with the owner's follow-up instruction to build the demo first without AI or hosting accounts.

## GitHub Pages delivery

The owner selected the free browser-only Pages demonstration. It is published at **https://csee-act.github.io/secondshelf/** from **https://github.com/csee-act/secondshelf**. The first deployment passed both jobs, and the HTTPS site was opened and checked in a real browser on 26 October 2026.

- IndexedDB stores inventory, resized photos, profile, and local demo listings per browser and site path.
- UI notices distinguish local listings from a shared marketplace. The server version remains available separately.
- The Pages workflow tests the source, builds public assets, and deploys updates from `main` after Pages is configured for GitHub Actions.
- Database files, uploads, environment files, temporary outputs, and local product documents are excluded from Git and deployment.
- All 16 automated tests pass. The Pages preview was checked under `/secondshelf/`: photo upload, save, reload persistence, listing creation, withdrawal, original image loading, and desktop/phone layouts. Browser console checks found no warnings or errors during those flows.
- Real AI, a shared public community, and cloud backup are not part of this Pages version. Clearing site data can remove browser records.

| Requirement | Status | Evidence or remaining work |
| --- | --- | --- |
| Photo capture and editable draft | Partial | Real upload and manual editing work. Live AI adapter is implemented and mock-tested; needs a server key and a real provider check. |
| Private inventory | Working locally | SQLite persistence; per-browser ownership; create, edit, search, and delete. |
| Activity records | Working | Last use and last move stay separate; exact, unknown, and approximate dates supported. |
| Owner decision | Working | Protected/high-attachment items, 180-day threshold, unknown context, and owner override covered. |
| Listing flow | Working locally | Public preview, Sell/Swap, shared feed across sessions, duplicate prevention, snapshot isolation, and withdrawal. |
| Live public access | Live on GitHub Pages | Browser-only demo at https://csee-act.github.io/secondshelf/. Shared server hosting remains a separate option. |
| Trust and recovery | Working demo controls | Ownership, private photo endpoints, CSRF/origin checks, parameterized SQL, image validation/metadata stripping, input/rate limits, manual AI fallback. Anonymous sessions are not production accounts. |
| Demo evidence | Verified locally | API/domain tests and full desktop/mobile UI flows. Screenshots under test-results. No demand interviews, human usability claims, or real AI performance claims. |

## Deliberate boundaries

No payments, live chat, transaction completion, automatic valuations, physical movement detection, or verified environmental impact. Public listings include only approved fields; private stories and storage labels never travel to the listing or image-labeling request automatically.

## Before the judged live demo

1. Open the published Pages URL and rehearse the two-minute walkthrough.
2. Check it on the team's demo device and state that records and demo listings remain local to each browser.
3. If showing the full shared/AI version later, provision persistent server storage, configure a private model key, and verify shared sessions and a real photo call separately.
4. Add short, real user evidence gathered by the team; no interview findings have been invented.
5. State that the implemented outcome is a published listing, not a completed exchange.
