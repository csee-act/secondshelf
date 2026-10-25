export const CATEGORIES = ['Kitchen', 'Electronics', 'Home & living', 'Hobbies', 'Books', 'Other'];
export const CONDITIONS = ['Not checked', 'Like new', 'Good', 'Fair', 'Needs repair'];
export const ATTACHMENTS = ['Not set', 'Ready to let go', 'Slight attachment', 'Unsure', 'Meaningful', 'Irreplaceable'];
export function today() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year:'numeric',month:'2-digit',day:'2-digit' }).format(new Date()); }
export function daysSince(date, now = today()) { return date ? Math.floor((Date.parse(now+'T00:00:00Z') - Date.parse(date+'T00:00:00Z')) / 86400000) : null; }
export function recommendation(item, now = today()) {
  if (item.listed) return { type:'listed', title:'A new chapter is waiting', label:'Listed', reason:'You have shared this item with the community. You can withdraw the listing at any time.' };
  if (item.protected || item.attachment >= 4) return { type:'keep', title:'Some things are worth keeping', label:'Meaningful keep', reason:item.protected ? 'You protected this item. It will stay out of suggestions to sell or swap.' : 'This item means a lot to you. Time on a shelf does not make it any less meaningful.' };
  if (!item.attachment || !item.lastUsed || item.usedApproximate) return { type:'context', title:'A little context goes a long way', label:'Needs a little context', reason:'Add an attachment level and a confirmed last-used date to get a suggestion. You can always decide for yourself.' };
  if (daysSince(item.lastUsed, now) >= 180) {
    if (item.attachment <= 2) return { type:'rehome', title:'Ready for a second chapter?', label:'Ready to pass on', reason:'You recorded low attachment and at least six months without use. Selling or swapping could give it a useful new home.' };
    return { type:'reuse', title:'Give it another moment', label:'Try using it again', reason:'You are unsure about letting this go. Try using it once before deciding whether to keep or share it.' };
  }
  return { type:'active', title:'Still part of your everyday', label:'In use', reason:'You have used this recently. Keep it easy to find for the next time you need it.' };
}
export function activityText(date, approximate = false, now = today()) {
  if (!date) return 'Last use unknown';
  if (approximate) return 'Around '+new Date(date+'T12:00:00Z').toLocaleDateString('en-MY', { month:'short', year:'numeric',timeZone:'UTC' });
  const days=daysSince(date, now);
  if (days===0) return 'Used today';
  if (days===1) return 'Used yesterday';
  if (days<30) return `Unused for ${days} days`;
  if (days<365) return `Unused for ${Math.floor(days/30)} months`;
  return `Unused for ${Math.floor(days/365)}+ years`;
}
export function money(n) { return n == null ? 'Not estimated' : 'RM '+Number(n).toLocaleString('en-MY', { maximumFractionDigits:2 }); }
