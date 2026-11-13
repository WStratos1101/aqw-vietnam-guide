// Class artwork is reusable only for the exact Class Wiki entity. No name/slot guessing.
const canonical = (url) => String(url || '').replace(/^http:/, 'https:').split(/[?#]/)[0].replace(/\/$/, '');
export function farmClassMedia(item, profiles, classSources, portraits) {
  if (item.category !== 'Classes') return null;
  const matches = profiles.filter(p => canonical(classSources[p.id]?.sourceUrl) === canonical(item.wikiUrl));
  if (matches.length !== 1) return null;
  const profile = matches[0];
  const portrait = portraits.find(a => a.classId === profile.id && a.id === profile.image &&
    canonical(a.sourceUrl) === canonical(item.wikiUrl) && a.verificationStatus === 'verified' &&
    a.usageStatus === 'approved_noncommercial' && a.policyUrl && a.sha256 &&
    a.imagePath?.startsWith('/images/aqw/classes/') && !a.imagePath.includes('..'));
  return { classHref: '/class/' + profile.slug, portrait: portrait || null };
}
