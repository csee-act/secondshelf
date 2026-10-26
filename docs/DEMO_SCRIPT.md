# Three-minute demo

Open https://csee-act.github.io/secondshelf/#plan in a fresh browser profile. Existing profiles retain their records; do not clear someone else's data.

**0:00–0:25 — Who and why.** “This is for someone moving out of an apartment in the next month. They inspect cupboards, debate what to keep and rewrite listings. SecondShelf helps them make one decision at a time.” Show the target/deadline.

**0:25–1:10 — Real AI.** Click Try photo recognition, then Suggest details from photo. Show the sample hammer's actual predictions. Use this draft, name it Demo hammer, add a storage location, low attachment and old confirmed use date. Expand extra details to add a fictional private memory. Save. Explain that value, sentiment and condition remain the owner's input.

**1:10–1:45 — The decision.** Choose Rehome in the queue and save its private memory card. Show the decision count and Memory box. Explain Keep and future Try again dates. Nothing is sold automatically.

**1:45–2:25 — A useful output.** Return to the plan, Create listing, choose Swap and enter a request. Save, open it in Community, Create a public link and review excluded fields. Open shared view. Another device can read the snapshot; availability is confirmed in the sharing channel. No live marketplace is claimed.

**2:25–3:00 — Proof and next step.** Reload to show persistence. Open Project brief. Explain the decision-before-listing focus and proposed 10-person pilot. Present genuine interview findings separately if collected; demand and willingness to pay are still unvalidated.

## Submission wording

**Who has this problem?** Our initial user is an apartment resident moving within 30 days, with useful belongings scattered across cupboards and boxes. Today they rely on memory, photographs and manual cleanouts, then create separate listings. Finding each item and deciding what to keep takes effort, especially when it carries a memory. Local customer interviews are still needed to validate this hypothesis.

**How does the app solve it?** SecondShelf turns a photo into a reviewed inventory entry and helps the owner choose Keep, Try again or Rehome before a deadline. It preserves private memories while creating a separate public sell/swap link. The demo is photo recognition → saved item → decision and memory → public snapshot.

**How did you build it?** We built SecondShelf with HTML, CSS and JavaScript, and host it on GitHub Pages. TensorFlow.js recognizes objects from photos on the device, while IndexedDB saves the inventory, decisions and memories. GitHub Actions runs the tests and publishes updates; shareable links contain only reviewed public listing details.

**What is different?** The product helps with the decision before the sale, combining a moving deadline, attachment-aware suggestions and a private memory box. Next, prove that real movers complete decisions and return, then test a pilot with an apartment manager or moving service. Adoption, partner demand and defensibility are not yet established.
