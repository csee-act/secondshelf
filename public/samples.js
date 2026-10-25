import { today } from './domain.js';
export const ASSETS = ['camera','cooker','guitar','headphones','lamp','books','plant','torch'];
function ago(days) { return new Date(Date.parse(today()+'T12:00:00Z')-days*86400000).toISOString().slice(0,10); }
export function sampleItems() {
  return [
    { name:'The little rice cooker', category:'Kitchen', asset:'cooker', location:'Kitchen · top cupboard', attachment:1, estimate:65, lastUsed:ago(245), lastMoved:ago(90), condition:'Good', description:'A compact rice cooker with a removable inner pot.', story:'My first apartment purchase. Time for someone else to enjoy it.' },
    { name:'Dad’s film camera', category:'Electronics', asset:'camera', location:'Bedroom · memory box', attachment:5, estimate:450, lastUsed:ago(740), lastMoved:ago(200), condition:'Good', protected:true, description:'A vintage film camera with a fixed lens.', story:'Dad took this on every family holiday. The photographs are lovely, but the memories behind the lens are even better.' },
    { name:'A weekend guitar', category:'Hobbies', asset:'guitar', location:'Living room · bookshelf', attachment:3, estimate:180, lastUsed:ago(210), lastMoved:ago(65), condition:'Good', description:'A well-loved acoustic guitar.', story:'Bought this to learn a few songs. Maybe it is time to try again.' },
    { name:'Wireless headphones', category:'Electronics', asset:'headphones', location:'Bedroom · desk drawer', attachment:2, estimate:120, lastUsed:ago(310), lastMoved:ago(160), condition:'Good', description:'Over-ear wireless headphones with padded ear cups.', story:'' },
    { name:'The reading light', category:'Home & living', asset:'lamp', location:'Living room · side table', attachment:2, estimate:45, lastUsed:ago(2), lastMoved:ago(40), condition:'Like new', description:'A warm desk lamp with a rounded shade.', story:'For evenings with a good book.' },
    { name:'Books for slow Sundays', category:'Books', asset:'books', location:'Living room · bookshelf', attachment:2, estimate:35, lastUsed:ago(400), lastMoved:ago(120), condition:'Fair', description:'A small collection of three books with well-read covers.', story:'' },
    { name:'The spare plant pot', category:'Home & living', asset:'plant', location:'Balcony · storage shelf', attachment:0, estimate:null, lastUsed:null, lastMoved:null, condition:'Not checked', description:'A terracotta planter.', story:'' },
    { name:'Emergency torch', category:'Home & living', asset:'torch', location:'Hallway · utility box', attachment:1, estimate:30, lastUsed:ago(390), lastMoved:ago(190), condition:'Good', protected:true, description:'A compact torch kept for power outages.', story:'Not used often, but useful when it matters.' }
  ].map(i=>({ ...i, protected:!!i.protected, usedApproximate:false, movedApproximate:false, estimateAsOf:i.estimate==null?null:today(), sample:true }));
}
export const communitySamples = [
  { asset:'lamp', name:'A light for your reading corner', description:'Small table lamp in good condition. A sample listing to explore the community.', condition:'Good', mode:'sell', price:40, swapFor:'', seller:'Aisha', community:'Taman Kita', sample:true },
  { asset:'books', name:'A few good weekend reads', description:'Three well-loved books looking for another reader. Sample listing.', condition:'Fair', mode:'swap', price:null, swapFor:'A plant cutting or another good book', seller:'Daniel', community:'Taman Kita', sample:true },
  { asset:'guitar', name:'Your next acoustic adventure', description:'A beginner acoustic guitar. Illustrative community listing.', condition:'Good', mode:'sell', price:160, swapFor:'', seller:'Mei', community:'Taman Kita', sample:true }
];
