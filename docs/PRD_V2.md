# SecondShelf — PRD v2

Desert Dreamers · Four-hour hackathon · Two or three builders · Free GitHub Pages · No provider accounts required.

## Promise and user

Help an apartment resident moving within 30 days decide what earns its box: keep meaningful belongings, try uncertain items again and prepare useful unused things for a second home.

The current workaround is manual cupboard inspection, memory, scattered photographs and separate marketplace/group-chat listings. Each item requires rediscovery, a decision and repeated entry of public details. Emotional attachment can delay the choice. This is our customer hypothesis; it has not been validated by interviews. Students moving out and households downsizing are possible adjacent segments.

Secondary context: Material Focus's *UK electrical waste: challenges & opportunities 2023* reports 880 million unwanted or unused electrical items in UK homes. This supports a broader idle-belongings problem, not Malaysian demand or our market size. [Primary research summary](https://materialfocus.org.uk/report-and-research/uk-electrical-waste-challenges-opportunities-2023/).

## Core journey

1. Set a target number of decisions and a deadline.
2. Add a photograph or use the labeled sample. Run local recognition and review its suggested name/category and model scores.
3. Add location, attachment, condition, optional owner estimate and known activity dates.
4. Review the explanation. Choose Keep, Try again with a date, or Rehome.
5. Optionally save a private photo/story memory card.
6. Review a separate Sell/Swap listing, create a public link and send it through the owner's chosen channel.
7. Reload to verify persistence; reconsider decisions or withdraw local listings when circumstances change.

## MVP requirements

| Priority | Capability | Acceptance |
| --- | --- | --- |
| Must | Photo inventory | Photo/record survive reload; existing inventory survives the upgrade. |
| Must | Actual AI | A model runs on image pixels; three real predictions appear; owner approves the draft; no fixed demo response. |
| Must | Honest context | Unknown/approximate history remains uncertain; AI never invents sentiment, price or condition. |
| Must | Decision plan | Goal/deadline and choices persist; undo returns an item; due reviews reappear on a later app visit. |
| Must | Sentimental control | Protection/high attachment exclude automatic rehome suggestions; overriding a meaningful item requires owner confirmation. |
| Must | Memory box | Private snapshot is independent of inventory deletion and can be explicitly removed. |
| Must | Portable public link | Works without sender records; only approved title, description, condition, price/swap request, seller, general community, sample marker and optional thumbnail are serialized. |
| Must | Reviewable proof | Live URL, demo script, verification contract, architecture and limitation notes. |
| Should | Failure recovery | Storage errors never claim success; AI failure leaves manual entry available; invalid links explain recovery. |

## Data and policy

The Pages app uses the existing path-specific IndexedDB database. Inventory/listings retain the `current` key; plan/decisions/memories use `journey`. Changes are transactional. No account or cloud backup is provided.

Memory cards retain an approved photo, name, story and date. Public links use a separate field allowlist and a tiny Canvas-reencoded JPEG; no private inventory object is serialized. Payloads are bounded and escaped. Copied snapshots cannot be recalled; availability must be checked with the sender. Clearing browser data also removes local records.

MobileNet V1 0.50 recognizes limited ImageNet classes via TensorFlow.js 4.22.0 on the CPU. Predictions are editable; category mapping is deterministic; model scores are not accuracy guarantees. Scripts and weights are self-hosted and no image is uploaded to an AI provider.

Keep/rehome suggestions are separate transparent rules: protection/high attachment first, missing context next, then at least 180 days since confirmed use with low attachment. A choice is an intention, not a sale. Keeping a meaningful item is a valid decision.

## Non-goals

Accounts/cloud sync, live shared feed, chat, reservations, payments, verified handovers, automatic market valuations, physical movement sensing, push notifications, carbon-savings claims or fabricated demand evidence. No Oracle service is implied.

## Next validation

Recruit 10 residents moving within 30 days. Observe their current process before showing the app, then ask each to decide on five real items. Proposed gates: seven complete three decisions unaided, median time to first decision under two minutes, four return within a week. Verify any handover separately. These are targets, not results.

Business hypothesis: apartment managers or moving services sponsor resident reuse workflows. Test willingness to pay in an actual pilot before billing. Trusted partner distribution and consented outcome learning could become advantages; no moat is established today.

## Four-hour allocation

- 0:00–0:30: agree on the moving scenario and conduct short real problem interviews.
- 0:30–2:00: one builder owns inventory/AI, another plan/listings; a third can own evidence, usability and integration.
- 2:00–3:00: connect the complete journey, verify persistence/privacy and deploy.
- 3:00–4:00: check the judging device and phone, rehearse, and add genuine interview findings.

Cut accounts, chat and valuation integrations before cutting the verified core journey. See BUILD_STATUS.md for what was actually checked.
