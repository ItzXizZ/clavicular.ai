/**
 * Curated purchase / research links for Softmax products and Hardmax procedures.
 */

export const BRAND_LINKS = {
  jawliner: 'https://www.jawliner.com/',
  curology: 'https://curology.com/',
  apostrophe: 'https://www.apostrophe.com/',
  theOrdinary: 'https://theordinary.com/',
  paulasChoice: 'https://www.paulaschoice.com/',
  cerave: 'https://www.cerave.com/',
  minoxidil: 'https://www.amazon.com/s?k=minoxidil+5%25+foam',
  masticGum: 'https://www.amazon.com/s?k=chios+mastic+gum',
  falim: 'https://www.amazon.com/s?k=falim+gum',
  foodScale: 'https://www.amazon.com/s?k=oxo+food+scale',
  caffeineEye: 'https://theordinary.com/en-us/caffeine-solution-5-egcg-serum-100425.html',
  retinol: 'https://www.cerave.com/skincare/moisturizers/skin-renewing-retinol-serum',
  finasteride: 'https://www.amazon.com/s?k=finasteride+1mg',
} as const;

/** Board-certified research / consult destinations for surgeries (not purchase links). */
export const SURGERY_LINKS: Record<string, string> = {
  'jaw implant': 'https://www.realself.com/surgical/jaw-implants',
  'custom jaw': 'https://www.realself.com/surgical/jaw-implants',
  wraparound: 'https://www.realself.com/surgical/jaw-implants',
  bimax: 'https://www.realself.com/surgical/jaw-surgery',
  'double jaw': 'https://www.realself.com/surgical/jaw-surgery',
  'orthognathic': 'https://www.realself.com/surgical/jaw-surgery',
  canthoplasty: 'https://www.realself.com/surgical/canthoplasty',
  'cheek implant': 'https://www.realself.com/surgical/cheek-implants',
  malar: 'https://www.realself.com/surgical/cheek-implants',
  rhinoplasty: 'https://www.realself.com/surgical/rhinoplasty',
  'lip lift': 'https://www.realself.com/surgical/lip-lift',
  bullhorn: 'https://www.realself.com/surgical/lip-lift',
  'buccal fat': 'https://www.realself.com/surgical/buccal-fat-removal',
  'hair transplant': 'https://www.realself.com/surgical/fue-hair-transplant',
  fue: 'https://www.realself.com/surgical/fue-hair-transplant',
  'co2 laser': 'https://www.realself.com/nonsurgical/fractional-laser',
  'fractional': 'https://www.realself.com/nonsurgical/fractional-laser',
  filler: 'https://www.realself.com/nonsurgical/dermal-fillers',
  botox: 'https://www.realself.com/nonsurgical/botox',
  microneedling: 'https://www.realself.com/nonsurgical/microneedling',
};

export function surgeryResearchUrl(procedureName: string): string {
  const lower = procedureName.toLowerCase();
  for (const [key, url] of Object.entries(SURGERY_LINKS)) {
    if (lower.includes(key)) return url;
  }
  return `https://www.realself.com/search?q=${encodeURIComponent(procedureName)}`;
}

export function amazonSearchUrl(term: string): string {
  return `https://www.amazon.com/s?k=${encodeURIComponent(term)}`;
}

/** Build product URL for AI recommendations — surgeries → RealSelf, else Amazon search. */
export function linkForRecommendation(
  name: string,
  typeHint?: string,
  amazonSearchTerm?: string
): string {
  const hard =
    typeHint === 'HARD' ||
    /surgery|implant|rhinoplasty|canthoplasty|bimax|transplant|lift|laser/i.test(name);

  if (hard) return surgeryResearchUrl(name);
  if (amazonSearchTerm) return amazonSearchUrl(amazonSearchTerm);
  return amazonSearchUrl(name);
}
