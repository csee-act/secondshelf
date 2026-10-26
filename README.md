# SecondShelf

**Decide what earns its box.** A moving plan for apartment residents: photograph your belongings, keep the memory, and give useful things a second chapter.

[Live app](https://csee-act.github.io/secondshelf/) · [Project brief](https://csee-act.github.io/secondshelf/#brief) · [Deployment](https://github.com/csee-act/secondshelf/actions/workflows/pages.yml)

## What works

- Real on-device photo recognition: TensorFlow.js 4.22.0 and MobileNet V1 0.50, three model predictions, owner-approved name/category. Includes a public-domain sample photo; no account or API key.
- Deadline and decision goal, explained review queue, Keep/Try again/Rehome, future review dates, persistent history and reconsideration.
- Private memory cards that preserve a photo/story independently of the inventory item, with explicit card removal.
- Photo inventory, search, locations, attachment, protection, condition, owner estimates, and separate last-used/last-moved records.
- Sell/Swap listings with public previews and portable snapshot links. The recipient does not need the sender's inventory.
- In-app project brief explaining the user, before/after, technical architecture, business hypothesis and next validation experiment.

## Run and test

Requires Node.js 24. No package install is needed.

```sh
node scripts/build-pages.mjs
node scripts/preview-pages.mjs
node --test tests/*.test.mjs
```

Preview: `http://127.0.0.1:4322/secondshelf/`. Set `PAGES_PORT` for another port. GitHub Actions tests, builds and deploys pushes to `main`; only `public/` is deployed.

## Architecture and limits

The static browser app saves inventory in the existing IndexedDB `current` record and its plan/memories in a separate `journey` record. Existing inventory is preserved. Clearing site data, storage eviction or ending a private session may erase records; there is no cloud backup.

`photo-ai.js` runs actual inference on image pixels using the CPU backend. Scripts/weights load only when recognition is requested (approximately 6.9 MB on first use) and are hosted with the app. No image is sent to an AI provider. The model recognizes limited ImageNet classes; its scores are not accuracy guarantees. Category mapping and keep/rehome suggestions are explicit rules, separate from inference.

`journey.js` validates choices and dates; `journey-store.js` persists them atomically. `share.js` allows only public listing fields, validates a bounded URL fragment and optionally includes a tiny JPEG. `feature-views.js` escapes displayed content.

The community feed is local with fictional samples. A listing link opens on another device but is a **snapshot**, not a live reservation or shared marketplace. Anyone with the link can read it. Withdrawing cannot recall old links. Confirm availability in the channel where the link was shared. No messaging, payments, verified handovers, automatic market prices or environmental savings are claimed. Progress counts decisions; prices are owner estimates.

## Optional Node server

`node server.mjs` serves `http://127.0.0.1:4321` with native Node HTTP, SQLite, anonymous browser sessions, private inventory ownership, CSRF/origin checks and a shared listing feed. Keep `data/` to preserve records. The plan and memories still live in browser storage. This is not production account recovery.

The older `/api/analyze` OpenAI adapter remains available when configured in `.env`; it is mock-tested but not live-provider verified. **The rebuilt UI uses local MobileNet**, so that adapter is not called and no provider key is required.

## Demo and evidence

- [PRD and scope](docs/PRD_V2.md)
- [Rubric mapping](docs/RUBRIC_REBUILD.md)
- [Demo and submission wording](docs/DEMO_SCRIPT.md)
- [AI Judge verification JSON](docs/verification-instructions.json)
- [Actual verification status](docs/BUILD_STATUS.md)

## Credits

TensorFlow.js and class labels: [TensorFlow](https://github.com/tensorflow/tfjs), Apache 2.0, license in `public/vendor/LICENSE.txt`. Weights: [TensorFlow-hosted MobileNet](https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.50_224/model.json), originally from [Keras/deep-learning-models](https://github.com/fchollet/deep-learning-models). Sample hammer: [Evan-Amos / Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Claw-hammer.jpg), public domain, resized preview. Other illustrations are original demo assets.

`scripts/fetch-ai-assets.mjs` explicitly refreshes the selected assets and records source URLs/checksums in `public/vendor/provenance.json`; CI does not run it. Review any refresh before committing. Databases, uploaded photos, secrets, temporary files and screenshots are excluded from publication.
