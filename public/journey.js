import { today, recommendation } from './domain.js';

export function inDays(days, from = today()) {
  const date = new Date(from + 'T12:00:00Z'); date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
export function initialJourney() {
  return { version: 1, goal: { target: 3, deadline: inDays(7) }, decisions: {}, memories: {} };
}
function validDate(date) {
  return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
}
export function changeJourney(journey, action, body, items) {
  if (action === 'forget-memory') {
    if (!Object.hasOwn(journey.memories, body.id)) throw new Error('This memory card is no longer here.');
    delete journey.memories[body.id]; return;
  }
  if (action === 'goal') {
    const target = Number(body.target);
    if (!Number.isInteger(target) || target < 1 || target > 50) throw new Error('Choose a goal from 1 to 50 decisions.');
    if (!validDate(body.deadline) || body.deadline < today() || body.deadline > inDays(366)) throw new Error('Choose a deadline within the next year.');
    journey.goal = { target, deadline: body.deadline };
    return;
  }
  const item = items.find(i => i.id === body.id);
  if (!item) throw new Error('This item is no longer on your shelf.');
  if (action === 'undo') { delete journey.decisions[item.id]; return; }
  if (action === 'memory') {
    if (!item.story?.trim()) throw new Error('Add a private story to this item before saving a memory.');
    journey.memories[item.id] = { name: item.name, story: item.story, imageUrl: item.imageUrl, savedAt: today() };
    return;
  }
  if (action !== 'decision' || !['keep', 'revisit', 'rehome'].includes(body.choice)) throw new Error('Choose Keep, Try again, or Rehome.');
  if (body.choice === 'rehome' && (item.protected || item.attachment >= 4) && body.confirmMeaningful !== true) throw new Error('Confirm your choice to rehome this meaningful item.');
  if (body.choice === 'revisit' && (!validDate(body.reviewOn) || body.reviewOn <= today() || body.reviewOn > inDays(366))) throw new Error('Choose a future review date within the next year.');
  journey.decisions[item.id] = { choice: body.choice, at: today(), reviewOn: body.choice === 'revisit' ? body.reviewOn : null };
  if (body.saveMemory === true && item.story?.trim()) journey.memories[item.id] = { name: item.name, story: item.story, imageUrl: item.imageUrl, savedAt: today() };
}
export function planSummary(items, journey, now = today()) {
  const completed = items.filter(i => journey.decisions[i.id]);
  const rank = { rehome: 0, reuse: 1, context: 2, active: 3, keep: 4, listed: 5 };
  const queue = items.filter(i => {
    const d = journey.decisions[i.id];
    return !d || (d.choice === 'revisit' && d.reviewOn <= now);
  }).sort((a, b) => {
    const dueA = journey.decisions[a.id]?.reviewOn <= now;
    const dueB = journey.decisions[b.id]?.reviewOn <= now;
    return Number(dueB) - Number(dueA) || rank[recommendation(a).type] - rank[recommendation(b).type];
  });
  return { completed, queue, counts: Object.fromEntries(['keep', 'revisit', 'rehome'].map(choice => [choice, completed.filter(i => journey.decisions[i.id].choice === choice).length])) };
}
