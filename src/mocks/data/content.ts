import type { CmsPage, FaqItem, HomeContent, Lookups, Media, StateWithLgas } from '@/types'
import avatarUrl from '@/assets/images/testimonial-avatar.webp'

const avatar = (alt: string): Media => ({
  id: 0,
  url: avatarUrl,
  thumbnail_url: avatarUrl,
  width: 64,
  height: 64,
  format: 'webp',
  alt_text: alt,
})

export function seedHomeContent(): HomeContent {
  return {
    stats: [
      { value: '15+', label: 'Years of Operating' },
      { value: '1200+', label: 'Clients served' },
      { value: '₦2B+', label: 'Value under management' },
      { value: '500+', label: 'Properties listed and sold' },
    ],
    testimonials: [
      { id: 1, quote: 'Amcom helped us find our dream family home with a smooth buying process. From viewing to closing, the team was responsive and transparent every step of the way.', author_name: 'Adaeze Okonkwo', author_title: 'Buyer at Palm Gardens Estate', avatar: avatar('Adaeze Okonkwo'), is_published: true },
      { id: 2, quote: 'Amcom’s property management services have delivered consistent returns on our real estate investments. Their reporting is clear, and the team is proactive and reliable.', author_name: 'James Thornton', author_title: 'Investor, Portfolio Client', avatar: avatar('James Thornton'), is_published: true },
      { id: 3, quote: 'The professional guidance we received throughout the entire home purchase journey was outstanding. Amcom made every step feel clear and stress-free.', author_name: 'Funke Adeyemi', author_title: 'Buyer at Lakeview Residences', avatar: avatar('Funke Adeyemi'), is_published: true },
      { id: 4, quote: 'My buyback position paid out exactly on the maturity date with every document in my dashboard. I have already rolled my capital into a second estate.', author_name: 'Ibrahim Musa', author_title: 'Buyback Investor', avatar: avatar('Ibrahim Musa'), is_published: true },
      { id: 5, quote: 'Listing my apartment was simple. The inspection happened within days and Amcom found a vetted tenant in under a month.', author_name: 'Chioma Nwosu', author_title: 'Landlord, Lekki', avatar: avatar('Chioma Nwosu'), is_published: true },
      { id: 6, quote: 'Clear terms, a signed contract and returns that were locked in from day one. Capital investment with Amcom is genuinely hassle-free.', author_name: 'Emeka Obi', author_title: 'Capital Investor', avatar: avatar('Emeka Obi'), is_published: true },
    ],
  }
}

let faqId = 0
const faq = (product: FaqItem['product'], question: string, answer: string): FaqItem => ({
  id: ++faqId,
  product,
  question,
  answer,
  position: faqId,
  is_published: true,
})

export function seedFaqs(): FaqItem[] {
  return [
    faq('buyback', 'Is this an investment with interest?', 'No. This is not an interest-based product. You are buying a real asset. Profit arises from a pre-agreed resale price (trade), not interest.'),
    faq('buyback', 'What documents do I receive after payment?', 'You receive a payment receipt, a signed Deed of Purchase, the Corporate Buyback Agreement and a post-dated cheque covering the agreed buyback amount. All documents are available in your dashboard.'),
    faq('buyback', 'Is my capital guaranteed?', 'Your position is backed by a real, titled plot of land and a legally binding corporate buyback guarantee executed at signing.'),
    faq('buyback', 'Can I buy multiple plots?', 'Yes. You can select several plots in the same estate, up to the per-order limit shown during checkout.'),
    faq('buyback', 'What happens at the end of the tenure?', 'At maturity Amcom repurchases the land at the pre-agreed price and pays your capital plus profit into your designated bank account.'),
    faq('buyback', 'Can I keep the land instead of selling back?', 'Yes. You may opt to keep the plot at maturity; our team will complete the title transfer to your name.'),
    faq('buyback', 'Can I exit before maturity?', 'Early exit is not standard, but our team can discuss options with you. Contact support for a review.'),
    faq('buyback', 'What fees apply?', 'There are no hidden fees. The price shown includes documentation. Statutory title-transfer charges apply only if you keep the land.'),
    faq('buyback', 'What if I find another buyer willing to pay more?', 'You are free to sell to a third party before maturity with Amcom’s consent; the buyback agreement then lapses.'),
    faq('buyback', 'Why only 50 plots?', 'Each estate is capped so that Amcom can guarantee every buyback from its balance sheet.'),
    faq('capital_investment', 'What is the minimum investment amount?', 'The minimum investment is ₦1,000,000. There is no upper limit.'),
    faq('capital_investment', 'How are my returns calculated?', 'Returns are calculated at a fixed rate - 18% for 6-month investments and 27% for 12-month investments. The rate is locked at signing.'),
    faq('capital_investment', 'Is this an investment with interest?', 'No. Capital Investment offers a fixed return based on land value appreciation, not traditional interest. Your return is guaranteed and pre-agreed.'),
    faq('capital_investment', 'Can I withdraw before maturity?', 'Capital Investment is structured for the full term. Early withdrawal is not standard, but please contact our team to discuss options.'),
    faq('capital_investment', 'How is my investment secured?', 'Your investment is backed by premium land assets held by Amcom. The land portfolio appreciates over time, underwriting your guaranteed return.'),
    faq('property_management', 'How do I list my property on Amcom?', 'Simply register your property through our platform, upload photos and details, and our team will verify and publish your listing within 24-48 hours.'),
    faq('property_management', 'What types of properties can I list?', 'Apartments, duplexes, houses, land, commercial spaces, offices and warehouses anywhere in Nigeria.'),
    faq('property_management', 'What fees does Amcom charge?', 'A one-time listing fee covers inspection, verification and marketing. A transparent service fee applies only when your property sells.'),
    faq('property_management', 'How does Amcom verify properties?', 'Our team physically inspects every property, reviews title documents and confirms ownership before a listing goes live.'),
    faq('property_management', 'How long does it take to find a buyer or tenant?', 'Most verified listings receive serious enquiries within two to four weeks, depending on location and pricing.'),
    faq('property_management', 'Can I manage my listing after it goes live?', 'Yes. You can track status, enquiries and viewings, and request edits from your dashboard at any time.'),
  ]
}

export function seedPages(): CmsPage[] {
  const body = (topic: string) =>
    `<h2>Overview</h2><p>This ${topic} explains how Amcom handles your information and your use of our services. It is maintained by our legal team and published from the Amcom content management system.</p><h3>Your responsibilities</h3><ul><li>Provide accurate information when creating an account.</li><li>Keep your login credentials confidential.</li><li>Contact <a href="mailto:hello@amcom.com">hello@amcom.com</a> with any questions.</li></ul><h3>Updates</h3><p>We may update this ${topic} from time to time. Material changes will be communicated by email.</p>`
  const updated = '2026-01-15T09:00:00Z'
  return [
    { slug: 'privacy-policy', title: 'Privacy Policy', body_html: body('policy'), updated_at: updated },
    { slug: 'terms-of-service', title: 'Terms of Service', body_html: body('agreement'), updated_at: updated },
    { slug: 'cookie-policy', title: 'Cookie Policy', body_html: body('policy'), updated_at: updated },
  ]
}

const STATE_NAMES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo',
  'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
]

const LGAS: Record<string, string[]> = {
  Lagos: ['Agege', 'Ajeromi-Ifelodun', 'Alimosho', 'Amuwo-Odofin', 'Apapa', 'Badagry', 'Epe', 'Eti-Osa', 'Ibeju-Lekki', 'Ifako-Ijaiye', 'Ikeja', 'Ikorodu', 'Kosofe', 'Lagos Island', 'Lagos Mainland', 'Mushin', 'Ojo', 'Oshodi-Isolo', 'Shomolu', 'Surulere'],
  Rivers: ['Abua/Odual', 'Ahoada East', 'Ahoada West', 'Akuku-Toru', 'Andoni', 'Asari-Toru', 'Bonny', 'Degema', 'Eleme', 'Emohua', 'Etche', 'Gokana', 'Ikwerre', 'Khana', 'Obio/Akpor', 'Ogba/Egbema/Ndoni', 'Ogu/Bolo', 'Okrika', 'Omuma', 'Opobo/Nkoro', 'Oyigbo', 'Port Harcourt', 'Tai'],
  FCT: ['Abaji', 'Abuja Municipal', 'Bwari', 'Gwagwalada', 'Kuje', 'Kwali'],
  Ogun: ['Abeokuta North', 'Abeokuta South', 'Ado-Odo/Ota', 'Ewekoro', 'Ifo', 'Ijebu Ode', 'Obafemi Owode', 'Sagamu'],
  Oyo: ['Ibadan North', 'Ibadan North-East', 'Ibadan South-West', 'Ogbomosho North', 'Oyo East', 'Oyo West'],
  Enugu: ['Enugu East', 'Enugu North', 'Enugu South', 'Nsukka', 'Udi'],
  Delta: ['Oshimili South', 'Uvwie', 'Warri South', 'Sapele', 'Ughelli North'],
  Anambra: ['Awka South', 'Idemili North', 'Nnewi North', 'Onitsha North', 'Onitsha South'],
}

export function seedLookups(): Lookups {
  const states: StateWithLgas[] = STATE_NAMES.map((name) => ({ name, lgas: LGAS[name] ?? [] }))
  return {
    countries: ['Nigeria', 'Ghana', 'United Kingdom', 'United States', 'Canada', 'South Africa', 'United Arab Emirates', 'Other'],
    states,
    id_types: [
      { value: 'nin', label: 'National Identification Number (NIN)' },
      { value: 'bvn', label: 'Bank Verification Number (BVN)' },
      { value: 'drivers_license', label: "Driver's Licence" },
      { value: 'international_passport', label: 'International Passport' },
      { value: 'voters_card', label: "Voter's Card" },
    ],
    relationships: ['Spouse', 'Father', 'Mother', 'Brother', 'Sister', 'Son', 'Daughter', 'Relative', 'Friend', 'Other'],
    banks: [
      { code: '044', name: 'Access Bank' },
      { code: '023', name: 'Citibank Nigeria' },
      { code: '050', name: 'Ecobank Nigeria' },
      { code: '070', name: 'Fidelity Bank' },
      { code: '011', name: 'First Bank of Nigeria' },
      { code: '214', name: 'First City Monument Bank' },
      { code: '058', name: 'Guaranty Trust Bank' },
      { code: '030', name: 'Heritage Bank' },
      { code: '50211', name: 'Kuda Bank' },
      { code: '999992', name: 'OPay' },
      { code: '076', name: 'Polaris Bank' },
      { code: '221', name: 'Stanbic IBTC Bank' },
      { code: '232', name: 'Sterling Bank' },
      { code: '033', name: 'United Bank For Africa' },
      { code: '035', name: 'Wema Bank' },
      { code: '057', name: 'Zenith Bank' },
    ],
    property_locations: ['Lagos Island', 'Lekki', 'Ikoyi', 'Victoria Island', 'Ikeja', 'Ajah', 'Port Harcourt', 'Maitama'],
  }
}
