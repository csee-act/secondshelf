# SecondShelf v2 build status

26 October 2026. Rebuilt against the uploaded rubric after a reported 64.8 score. No category breakdown was supplied; a score increase is not guaranteed.

## Implemented

| Area | Behavior |
| --- | --- |
| Target user | Apartment resident preparing to move within 30 days; explicit on opening screen. |
| Photo AI | Self-hosted TensorFlow.js 4.22.0 + MobileNet V1 0.50; CPU inference, three predictions, editable approval, no key. |
| Decision plan | Goal/deadline, Keep/Try again/Rehome, reasons, saved history, undo, future reviews and sentimental-item confirmation. |
| Memory box | Private photo/story snapshots; retained independently of inventory; explicit removal. |
| Listing links | Allowlisted public snapshot, bounded thumbnail, recipient view independent of sender storage; invalid-link handling. |
| Inventory | Existing records retained; photos, edit/search, attachment, value, location, protection and separate activity dates. |
| Rubric | In-app project brief, PRD, business hypothesis, secondary evidence context and proposed customer-validation gates. |

## Verified

- 23 automated tests pass: original server/API coverage plus planning, memory retention/removal, link privacy, validation, hostile text escaping and asset checksums.
- Browser ran the real model: sample hammer classified as `hammer`, 91.9% model score, approximately 0.7 seconds displayed locally. One example, not an accuracy benchmark or human usability measurement.
- Browser applied the draft, saved a new item, chose Rehome, saved its memory, reloaded and found the retained record/card.
- Browser created a Swap listing and opened its link from a `127.0.0.1` sender on a `localhost` recipient. These have separate IndexedDB origins; the snapshot and thumbnail rendered without sender inventory.
- Recipient omitted the private story and exact storage location. Desktop showed no horizontal overflow; no console warnings/errors occurred in the checked core flow.
- Phone breakpoint verification is pending: the in-app viewport override did not change the preview's measured width. Responsive styles are included; a phone-device check is still needed.
- GitHub Actions run [40247853468](https://github.com/csee-act/secondshelf/actions/runs/40247853468) passed build, 23 tests and deployment for app commit `3b42ea6`.
- The live GitHub Pages app was reloaded and checked: the existing eight inventory items remained; the new moving plan opened; real photo inference returned `hammer` with a 91.9% model score in 7.1 seconds including the first asset load on this machine; applying the draft filled the editable name. No test item was saved into the existing live inventory.
- Local browser checks additionally covered goal editing, saved future-review dates, sentimental protection, same-tab snapshot navigation and the project brief. Screenshots are saved locally under `test-results/secondshelf-v2-live.png` and `test-results/secondshelf-v2-live-ai.png`.

## Unvalidated

Customer demand, repeated use, willingness to pay and completed handovers. The feed remains local; portable links are snapshots. No cloud sync, background notifications, live comparable prices, chat, payments or verified impact. The optional Node remote-AI adapter remains only mock-tested; the main UI uses actual local inference.
