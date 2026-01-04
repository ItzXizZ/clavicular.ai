import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with comprehensive looksmaxxing data...');

  // Clear existing data
  console.log('  Clearing existing data...');
  await prisma.product.deleteMany();
  await prisma.improvement.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.feature.deleteMany();

  // ============================================
  // FEATURES - Using createMany for efficiency
  // ============================================
  console.log('  Creating features...');
  await prisma.feature.createMany({
    data: [
      // HARMONY (HARM)
      { id: 'ipd', name: 'Interpupillary Distance', category: 'HARM', importance: 'high', idealValue: '62-65mm, ESR 46-50%', measurementMethod: 'Distance between pupil centers', weight: 1.2 },
      { id: 'facial_thirds', name: 'Facial Thirds', category: 'HARM', importance: 'high', idealValue: '1:1:1 proportion (upper:middle:lower)', measurementMethod: 'Trichion to glabella : glabella to subnasale : subnasale to menton', weight: 1.2 },
      { id: 'fwhr', name: 'Facial Width-to-Height Ratio', category: 'HARM', importance: 'high', idealValue: '1.8-2.0', measurementMethod: 'Bizygomatic width / upper face height', weight: 1.2 },
      { id: 'canthal_tilt', name: 'Canthal Tilt', category: 'HARM', importance: 'high', idealValue: 'Positive 3-8 degrees', measurementMethod: 'Angle of eye axis from horizontal', weight: 1.2 },
      { id: 'nasofrontal_angle', name: 'Nasofrontal Angle', category: 'HARM', importance: 'medium', idealValue: '125-135 degrees', measurementMethod: 'Angle between forehead and nose bridge at nasion', weight: 1.0 },
      { id: 'chin_philtrum', name: 'Chin to Philtrum Ratio', category: 'HARM', importance: 'medium', idealValue: '2:1 (chin twice philtrum length)', measurementMethod: 'Chin height / philtrum length', weight: 1.0 },
      { id: 'bizygomatic', name: 'Bizygomatic Width', category: 'HARM', importance: 'medium', idealValue: '140-150mm', measurementMethod: 'Distance between cheekbone peaks', weight: 1.0 },
      { id: 'ramus_length', name: 'Ramus Length', category: 'HARM', importance: 'high', idealValue: 'Long ramus with strong vertical jaw height', measurementMethod: 'Vertical height of jaw from gonion to condyle', weight: 1.2 },
      // ANGULARITY (ANGU)
      { id: 'gonial_angle', name: 'Gonial Angle', category: 'ANGU', importance: 'high', idealValue: '115-125 degrees (males), 125-135 (females)', measurementMethod: 'Angle at the jaw corner', weight: 1.2 },
      { id: 'bigonial', name: 'Bigonial Width', category: 'ANGU', importance: 'high', idealValue: '100-120mm, ~75% of bizygomatic', measurementMethod: 'Distance between jaw angles', weight: 1.2 },
      { id: 'jaw_definition', name: 'Jaw Definition', category: 'ANGU', importance: 'high', idealValue: 'Sharp, defined mandible border', measurementMethod: 'Visual assessment of masseter and mandible definition', weight: 1.2 },
      { id: 'cheekbone_visibility', name: 'Cheekbone Visibility', category: 'ANGU', importance: 'high', idealValue: 'High, wide-set malars with sharp shadow line', measurementMethod: 'Assessment of zygomatic hollowing', weight: 1.2 },
      { id: 'chin_angularity', name: 'Chin Angularity', category: 'ANGU', importance: 'medium', idealValue: 'Squared chin pad, sharp pogonion definition', measurementMethod: 'Chin shape assessment', weight: 1.0 },
      // DIMORPHISM (DIMO)
      { id: 'midface_ratio', name: 'Midface Ratio', category: 'DIMO', importance: 'high', idealValue: '47-50mm (pupil to mouth)', measurementMethod: 'Eye center to mouth center distance', weight: 1.2 },
      { id: 'brow_ridge', name: 'Brow Ridge Projection', category: 'DIMO', importance: 'medium', idealValue: 'Prominent supraorbital ridge (males)', measurementMethod: 'Glabella projection relative to eye depth', weight: 1.0 },
      { id: 'eye_depth', name: 'Eye Depth', category: 'DIMO', importance: 'highest', idealValue: 'Deepset with hunter-eye appearance', measurementMethod: 'Orbital rim to cornea distance', weight: 1.5 },
      { id: 'buccal_fat', name: 'Buccal Fat', category: 'DIMO', importance: 'high', idealValue: 'Very low buccal fat, hollowing beneath cheekbones', measurementMethod: 'Visual assessment of facial fat distribution', weight: 1.2 },
      // MISCELLANEOUS (MISC)
      { id: 'symmetry', name: 'Facial Symmetry', category: 'MISC', importance: 'high', idealValue: '>95% bilateral symmetry', measurementMethod: 'Left-right facial feature alignment', weight: 1.2 },
      { id: 'pfl', name: 'Palpebral Fissure Length', category: 'MISC', importance: 'medium', idealValue: '27-32mm', measurementMethod: 'Eye width from inner to outer canthus', weight: 1.0 },
      { id: 'philtrum', name: 'Philtrum Length', category: 'MISC', importance: 'medium', idealValue: '12-15mm (short is ideal)', measurementMethod: 'Subnasale to vermilion border', weight: 1.0 },
      { id: 'esr', name: 'Eye Separation Ratio', category: 'MISC', importance: 'medium', idealValue: '46-50%', measurementMethod: 'IPD / face width percentage', weight: 1.0 },
      { id: 'skin_quality', name: 'Skin Quality', category: 'MISC', importance: 'medium', idealValue: 'Clear, even tone, no acne', measurementMethod: 'Visual assessment of blemishes and texture', weight: 1.0 },
      { id: 'under_eye', name: 'Under Eye Area', category: 'MISC', importance: 'medium', idealValue: 'No dark circles, minimal lower eyelid exposure', measurementMethod: 'Periorbital area assessment', weight: 1.0 },
      { id: 'nose_shape', name: 'Nose Shape', category: 'MISC', importance: 'medium', idealValue: 'Straight dorsum, defined tip, minimal bulbosity', measurementMethod: 'Nasal aesthetic assessment', weight: 1.0 },
      { id: 'hair_quality', name: 'Hair Quality', category: 'MISC', importance: 'medium', idealValue: 'Full hairline, dense coverage', measurementMethod: 'Hair density and recession assessment', weight: 1.0 },
      { id: 'lip_shape', name: 'Lip Shape', category: 'MISC', importance: 'medium', idealValue: 'Well-defined cupids bow, proportionate fullness', measurementMethod: 'Lip proportion assessment', weight: 1.0 },
    ],
  });
  console.log('  ✅ Created features');

  // ============================================
  // ISSUES - Problems that can be detected
  // ============================================
  console.log('  Creating issues...');
  
  // Create issues without feature connections first
  await prisma.issue.createMany({
    data: [
      { id: 'narrow_jaw', displayName: 'Narrow/Recessed Jaw', description: 'Bigonial width below ideal range, jaw lacks definition and forward projection', severity: 'moderate' },
      { id: 'short_ramus', displayName: 'Short Ramus', description: 'Insufficient vertical jaw height, weak mandibular ramus', severity: 'moderate' },
      { id: 'obtuse_gonial', displayName: 'Obtuse Gonial Angle', description: 'Jaw angle too open/rounded, lacking sharp definition', severity: 'moderate' },
      { id: 'weak_chin', displayName: 'Weak/Recessed Chin', description: 'Insufficient chin projection and definition', severity: 'moderate' },
      { id: 'high_bodyfat', displayName: 'Suboptimal Facial Definition', description: 'Excess facial fat obscuring bone structure', severity: 'moderate' },
      { id: 'excess_buccal_fat', displayName: 'Excess Buccal Fat', description: 'Prominent buccal fat pads obscuring cheekbone definition', severity: 'mild' },
      { id: 'shallow_eyes', displayName: 'Shallow Eye Area', description: 'Insufficient eye depth and weak brow ridge', severity: 'moderate' },
      { id: 'negative_canthal_tilt', displayName: 'Neutral or negative canthal tilt', description: 'Eye outer corners lower than or level with inner corners', severity: 'mild' },
      { id: 'under_eye_issues', displayName: 'Under Eye Circles/Hollows', description: 'Dark circles, periorbital darkening, or tear trough hollowing', severity: 'mild' },
      { id: 'upper_eyelid_exposure', displayName: 'Upper Eyelid Exposure', description: 'Excessive upper eyelid visibility, puffy or hooded eyes', severity: 'mild' },
      { id: 'flat_cheekbones', displayName: 'Narrow cheekbone projection', description: 'Insufficient zygomatic projection and width', severity: 'moderate' },
      { id: 'poor_skin', displayName: 'Skin Quality Issues', description: 'Acne, uneven tone, texture problems, or scarring', severity: 'mild' },
      { id: 'acne_scarring', displayName: 'Acne Scarring', description: 'Visible acne scars affecting skin texture', severity: 'mild' },
      { id: 'nose_issues', displayName: 'Nasal Aesthetic Issues', description: 'Dorsal hump, bulbous tip, wide alar base, or asymmetry', severity: 'mild' },
      { id: 'long_philtrum', displayName: 'Long Philtrum', description: 'Distance from nose to lip above ideal range', severity: 'mild' },
      { id: 'thin_lips', displayName: 'Thin/Undefined Lips', description: 'Thin lips lacking definition or volume', severity: 'mild' },
      { id: 'hair_loss', displayName: 'Hair Loss/Thinning', description: 'Male pattern baldness, receding hairline, or thinning', severity: 'moderate' },
      { id: 'long_midface', displayName: 'Long Midface', description: 'Middle facial third disproportionately long', severity: 'mild' },
      { id: 'asymmetry', displayName: 'Facial Asymmetry', description: 'Left-right facial imbalance above normal range', severity: 'moderate' },
    ],
  });
  console.log('  ✅ Created issues');

  // ============================================
  // IMPROVEMENTS - Comprehensive Methods
  // ============================================
  console.log('  Creating improvements...');
  
  // JAW IMPROVEMENTS
  await prisma.improvement.create({
    data: {
      issueId: 'narrow_jaw',
      type: 'SOFT',
      name: 'Mewing + Chewing Protocol',
      description: 'Proper tongue posture (mewing) combined with resistance chewing to strengthen masseter muscles and potentially improve jaw definition over time. Most effective under age 25.',
      timeline: '6-24 months for noticeable changes',
      effectiveness: 'Moderate for muscle growth, limited for bone restructuring',
      costMin: 0,
      costMax: 60,
      risks: '["TMJ issues if overdone", "Muscle fatigue", "Jaw soreness initially"]',
    },
  });

  await prisma.improvement.create({
    data: {
      issueId: 'narrow_jaw',
      type: 'SOFT',
      name: 'Leanmaxxing (Fat Loss)',
      description: 'Reduce body fat to 10-14% through caloric deficit and exercise to reveal underlying jaw structure. Often produces dramatic improvements in facial definition.',
      timeline: '3-12 months depending on starting point',
      effectiveness: 'Very high for revealing bone structure',
      costMin: 0,
      costMax: 100,
      risks: '["Muscle loss if not done properly", "Potential fatigue"]',
    },
  });

  await prisma.improvement.create({
    data: {
      issueId: 'narrow_jaw',
      type: 'SEMI',
      name: 'Jaw Filler (Hyaluronic Acid)',
      description: 'Injectable hyaluronic acid dermal fillers to add definition and width to the jawline. Fully reversible with hyaluronidase if needed.',
      timeline: 'Immediate results, lasts 12-18 months',
      effectiveness: 'High for adding definition',
      costMin: 1500,
      costMax: 4000,
      risks: '["Swelling", "Bruising", "Asymmetry risk", "Filler migration", "Vascular occlusion (rare)"]',
    },
  });

  await prisma.improvement.create({
    data: {
      issueId: 'narrow_jaw',
      type: 'HARD',
      name: 'Custom Jaw Implants (Wraparound)',
      description: 'Patient-specific silicone implants designed from CT scans to provide permanent structural enhancement to the entire mandible including chin and angles.',
      timeline: 'Permanent, 2-4 weeks recovery',
      effectiveness: 'Very high - permanent transformation',
      costMin: 15000,
      costMax: 45000,
      risks: '["Infection", "Nerve damage (temporary or permanent)", "Implant shifting", "Revision surgery", "Asymmetry"]',
    },
  });

  await prisma.improvement.create({
    data: {
      issueId: 'narrow_jaw',
      type: 'HARD',
      name: 'Bimax Surgery (Double Jaw Surgery)',
      description: 'Gold standard for facial restructuring. Both upper and lower jaws repositioned for optimal facial harmony and projection.',
      timeline: '3-6 months full recovery',
      effectiveness: 'Highest - transformative results',
      costMin: 30000,
      costMax: 80000,
      risks: '["Extended recovery", "Numbness", "TMJ changes", "Need for orthodontics", "Infection"]',
    },
  });

  // EYE AREA
  await prisma.improvement.create({
    data: {
      issueId: 'negative_canthal_tilt',
      type: 'SOFT',
      name: 'Eye Area Optimization',
      description: 'While bone structure is genetic, reducing periorbital puffiness and optimizing skincare can enhance eye area appearance.',
      timeline: '4-8 weeks',
      effectiveness: 'Low - cannot change bone structure',
      costMin: 15,
      costMax: 100,
      risks: '["Minimal"]',
    },
  });

  await prisma.improvement.create({
    data: {
      issueId: 'negative_canthal_tilt',
      type: 'HARD',
      name: 'Canthoplasty',
      description: 'Surgical repositioning of the lateral canthus to create positive canthal tilt. Most effective permanent solution.',
      timeline: 'Permanent, 2-4 weeks recovery',
      effectiveness: 'High',
      costMin: 4000,
      costMax: 12000,
      risks: '["Scarring", "Asymmetry", "Overcorrection", "Dry eyes", "Need for revision"]',
    },
  });

  // UNDER EYE
  await prisma.improvement.create({
    data: {
      issueId: 'under_eye_issues',
      type: 'SOFT',
      name: 'Under Eye Skincare Protocol',
      description: 'Targeted skincare with caffeine, vitamin C, retinol, and peptides to reduce dark circles and improve skin quality.',
      timeline: '4-12 weeks',
      effectiveness: 'Moderate for pigmentation, low for hollows',
      costMin: 20,
      costMax: 150,
      risks: '["Irritation with retinol", "Sun sensitivity"]',
    },
  });

  await prisma.improvement.create({
    data: {
      issueId: 'under_eye_issues',
      type: 'SEMI',
      name: 'Under Eye Filler (Tear Trough)',
      description: 'Hyaluronic acid filler to fill hollow tear troughs and reduce shadow/dark circle appearance.',
      timeline: 'Immediate, lasts 12-18 months',
      effectiveness: 'High for hollowness, moderate for pigment',
      costMin: 600,
      costMax: 1500,
      risks: '["Tyndall effect (blue tint)", "Lumps", "Swelling", "Vascular occlusion (rare)"]',
    },
  });

  // CHEEKBONES
  await prisma.improvement.create({
    data: {
      issueId: 'flat_cheekbones',
      type: 'SOFT',
      name: 'Cheekbone Enhancement Protocol',
      description: 'Leanmaxxing to reduce facial fat and reveal natural bone structure, combined with strategic lighting and grooming.',
      timeline: '3-6 months',
      effectiveness: 'Moderate - depends on underlying bone',
      costMin: 0,
      costMax: 50,
      risks: '["Minimal"]',
    },
  });

  await prisma.improvement.create({
    data: {
      issueId: 'flat_cheekbones',
      type: 'SEMI',
      name: 'Cheekbone Filler (Voluma/Radiesse)',
      description: 'Hyaluronic acid or Radiesse filler to enhance zygomatic projection and width. Creates immediate cheekbone definition.',
      timeline: 'Immediate, lasts 12-24 months',
      effectiveness: 'High',
      costMin: 800,
      costMax: 3000,
      risks: '["Swelling", "Asymmetry", "Filler migration", "Vascular occlusion (rare)"]',
    },
  });

  await prisma.improvement.create({
    data: {
      issueId: 'flat_cheekbones',
      type: 'HARD',
      name: 'Cheek/Malar Implants',
      description: 'Silicone implants for permanent cheekbone enhancement. Various styles available for different aesthetic goals.',
      timeline: 'Permanent, 2-3 weeks recovery',
      effectiveness: 'Very high',
      costMin: 6000,
      costMax: 15000,
      risks: '["Infection", "Implant shifting", "Asymmetry", "Nerve damage", "Bone erosion"]',
    },
  });

  // SKIN
  await prisma.improvement.create({
    data: {
      issueId: 'poor_skin',
      type: 'SOFT',
      name: 'Comprehensive Skincare Protocol',
      description: 'Evidence-based routine: gentle cleanser, vitamin C (AM), retinoid (PM), moisturizer, and SPF 30+ daily. The foundation of skin improvement.',
      timeline: '3-6 months for significant improvement',
      effectiveness: 'High with consistency',
      costMin: 30,
      costMax: 200,
      risks: '["Initial irritation with retinoids", "Purging period", "Sun sensitivity"]',
    },
  });

  await prisma.improvement.create({
    data: {
      issueId: 'poor_skin',
      type: 'SEMI',
      name: 'Microneedling',
      description: 'Professional microneedling creates controlled micro-injuries to stimulate collagen. Effective for texture, pores, and mild scarring.',
      timeline: '3-6 sessions, 4-6 weeks apart',
      effectiveness: 'Moderate to high',
      costMin: 200,
      costMax: 700,
      risks: '["Redness", "Swelling", "Infection if unsanitary", "Post-inflammatory hyperpigmentation"]',
    },
  });

  await prisma.improvement.create({
    data: {
      issueId: 'poor_skin',
      type: 'HARD',
      name: 'Fractional CO2 Laser Resurfacing',
      description: 'Ablative laser that removes damaged skin layers and stimulates deep collagen remodeling. Most effective for significant texture issues.',
      timeline: 'Permanent improvement, 1-2 weeks downtime',
      effectiveness: 'Very high',
      costMin: 1500,
      costMax: 5000,
      risks: '["Prolonged redness", "Hyperpigmentation", "Scarring (rare)", "Infection"]',
    },
  });

  // HAIR LOSS
  await prisma.improvement.create({
    data: {
      issueId: 'hair_loss',
      type: 'SOFT',
      name: 'Topical Minoxidil Protocol',
      description: 'FDA-approved treatment that stimulates hair follicles. Apply 5% solution or foam twice daily to affected areas.',
      timeline: '4-6 months to see results',
      effectiveness: 'Moderate - maintains and can regrow',
      costMin: 15,
      costMax: 50,
      risks: '["Scalp irritation", "Initial shedding", "Unwanted facial hair", "Must continue indefinitely"]',
    },
  });

  await prisma.improvement.create({
    data: {
      issueId: 'hair_loss',
      type: 'SEMI',
      name: 'Oral Finasteride (1mg)',
      description: 'DHT blocker that prevents further hair loss and can promote regrowth. Most effective treatment for hair maintenance.',
      timeline: '3-6 months to see results',
      effectiveness: 'High - gold standard for prevention',
      costMin: 10,
      costMax: 30,
      risks: '["Sexual side effects (2-3%)", "Depression (rare)", "Must continue indefinitely"]',
    },
  });

  await prisma.improvement.create({
    data: {
      issueId: 'hair_loss',
      type: 'HARD',
      name: 'FUE Hair Transplant',
      description: 'Individual follicles extracted from donor area and transplanted. Natural results with no linear scar.',
      timeline: 'Permanent, full results in 12-18 months',
      effectiveness: 'Very high',
      costMin: 8000,
      costMax: 25000,
      risks: '["Shock loss", "Poor growth", "Scarring", "Need for multiple sessions"]',
    },
  });

  // NOSE
  await prisma.improvement.create({
    data: {
      issueId: 'nose_issues',
      type: 'SEMI',
      name: 'Non-Surgical Rhinoplasty (Filler)',
      description: 'HA filler to camouflage bumps, improve symmetry, or refine the tip. Cannot make nose smaller but can improve proportions.',
      timeline: 'Immediate, lasts 12-18 months',
      effectiveness: 'Moderate - limited to adding volume',
      costMin: 700,
      costMax: 2500,
      risks: '["Swelling", "Asymmetry", "Vascular occlusion (serious risk)", "Cannot reduce size"]',
    },
  });

  await prisma.improvement.create({
    data: {
      issueId: 'nose_issues',
      type: 'HARD',
      name: 'Rhinoplasty',
      description: 'Surgical nose reshaping. Can address dorsal hump, tip refinement, width reduction, and functional issues. Often most impactful single procedure.',
      timeline: 'Permanent, 2-4 weeks visible recovery, 1 year final result',
      effectiveness: 'Very high',
      costMin: 6000,
      costMax: 18000,
      risks: '["Swelling (prolonged)", "Asymmetry", "Revision rate ~10-15%", "Breathing changes", "Numbness"]',
    },
  });

  // LIPS
  await prisma.improvement.create({
    data: {
      issueId: 'thin_lips',
      type: 'SEMI',
      name: 'Lip Filler (Hyaluronic Acid)',
      description: 'HA filler for lip enhancement. Can increase volume, define borders, and improve symmetry. Fully reversible.',
      timeline: 'Immediate, lasts 6-12 months',
      effectiveness: 'High',
      costMin: 500,
      costMax: 1500,
      risks: '["Swelling", "Bruising", "Lumps", "Asymmetry", "Vascular occlusion (rare)"]',
    },
  });

  await prisma.improvement.create({
    data: {
      issueId: 'long_philtrum',
      type: 'HARD',
      name: 'Lip Lift Surgery (Bullhorn)',
      description: 'Surgical excision of skin under the nose to permanently shorten the philtrum and increase upper lip show.',
      timeline: 'Permanent, 2-3 weeks recovery',
      effectiveness: 'Very high',
      costMin: 4000,
      costMax: 8000,
      risks: '["Visible scarring", "Asymmetry", "Excessive tension on lip", "Unnatural appearance if overdone"]',
    },
  });

  // BODY FAT
  await prisma.improvement.create({
    data: {
      issueId: 'high_bodyfat',
      type: 'SOFT',
      name: 'Comprehensive Leanmaxxing Protocol',
      description: 'Strategic fat loss through caloric deficit (500cal/day), high protein intake, and resistance training. Target 10-14% body fat for optimal facial definition.',
      timeline: '3-6 months for significant results',
      effectiveness: 'Very high - often transformative',
      costMin: 0,
      costMax: 100,
      risks: '["Muscle loss without proper protein/training", "Fatigue", "Potential loose skin if extreme loss"]',
    },
  });

  await prisma.improvement.create({
    data: {
      issueId: 'excess_buccal_fat',
      type: 'HARD',
      name: 'Buccal Fat Removal',
      description: 'Surgical removal of buccal fat pads through intraoral incision. Creates permanent cheek hollowing and enhanced bone visibility.',
      timeline: 'Permanent, 1-2 weeks recovery',
      effectiveness: 'High for cheek definition',
      costMin: 3000,
      costMax: 8000,
      risks: '["Over-resection causing gaunt appearance", "Asymmetry", "Accelerated facial aging", "Nerve damage"]',
    },
  });

  console.log('  ✅ Created improvements');

  // ============================================
  // PRODUCTS - With Images and Links
  // ============================================
  console.log('  Creating products...');

  // Get improvement IDs
  const mewingImp = await prisma.improvement.findFirst({ where: { name: { contains: 'Mewing' } } });
  const leanmaxImp = await prisma.improvement.findFirst({ where: { name: { contains: 'Leanmaxxing Protocol' } } });
  const skincareImp = await prisma.improvement.findFirst({ where: { name: { contains: 'Comprehensive Skincare' } } });
  const eyeImp = await prisma.improvement.findFirst({ where: { name: { contains: 'Eye Area Optimization' } } });
  const underEyeImp = await prisma.improvement.findFirst({ where: { name: { contains: 'Under Eye Skincare' } } });
  const hairImp = await prisma.improvement.findFirst({ where: { name: { contains: 'Topical Minoxidil' } } });
  const cheekImp = await prisma.improvement.findFirst({ where: { name: { contains: 'Cheekbone Enhancement' } } });

  // JAW PRODUCTS
  if (mewingImp) {
    await prisma.product.create({
      data: {
        name: 'Mastic Gum (Greek)',
        brand: 'Chios Mastiha',
        category: 'device',
        subcategory: 'jaw_exercise',
        priceMin: 18,
        priceMax: 35,
        purchaseUrls: '["https://www.amazon.com/dp/B07NQHQ4CC", "https://www.greekinternetmarket.com/mastic-gum"]',
        imageUrl: 'https://m.media-amazon.com/images/I/71kJQGLXhAL._AC_SL1500_.jpg',
        effectivenessRating: 7.5,
        riskLevel: 'low',
        usageInstructions: 'Chew for 30-60 minutes daily, alternating sides. Start with 1 piece and increase gradually.',
        timelineToResults: '3-6 months',
        sideEffects: '["TMJ soreness initially", "Jaw fatigue", "Gum sensitivity"]',
        improvements: { connect: { id: mewingImp.id } },
      },
    });

    await prisma.product.create({
      data: {
        name: 'Falim Gum (Sugar-Free)',
        brand: 'Falim',
        category: 'device',
        subcategory: 'jaw_exercise',
        priceMin: 8,
        priceMax: 15,
        purchaseUrls: '["https://www.amazon.com/dp/B07BF71F5N"]',
        imageUrl: 'https://m.media-amazon.com/images/I/61LKzSXh-lL._AC_SL1500_.jpg',
        effectivenessRating: 7.0,
        riskLevel: 'low',
        usageInstructions: 'Chew multiple pieces for increased resistance. Great for beginners.',
        timelineToResults: '3-6 months',
        improvements: { connect: { id: mewingImp.id } },
      },
    });

    await prisma.product.create({
      data: {
        name: 'Jawliner Fitness Gum',
        brand: 'Jawliner',
        category: 'device',
        subcategory: 'jaw_exercise',
        priceMin: 30,
        priceMax: 65,
        purchaseUrls: '["https://www.jawliner.com", "https://www.amazon.com/dp/B08BNCFSCC"]',
        imageUrl: 'https://m.media-amazon.com/images/I/71sJm4JPLBL._AC_SL1500_.jpg',
        effectivenessRating: 7.0,
        riskLevel: 'low',
        usageInstructions: 'Bite and hold for resistance training. Start with beginner (40lb) and progress.',
        timelineToResults: '2-4 months',
        improvements: { connect: { id: mewingImp.id } },
      },
    });
  }

  // LEANMAXXING PRODUCTS
  if (leanmaxImp) {
    await prisma.product.create({
      data: {
        name: 'Digital Food Scale',
        brand: 'Etekcity',
        category: 'device',
        subcategory: 'nutrition',
        priceMin: 10,
        priceMax: 20,
        purchaseUrls: '["https://www.amazon.com/dp/B0113UZJE2"]',
        imageUrl: 'https://m.media-amazon.com/images/I/71LZH+RK7DL._AC_SL1500_.jpg',
        effectivenessRating: 9.0,
        riskLevel: 'low',
        usageInstructions: 'Weigh all food for accurate calorie tracking. Essential for cutting.',
        timelineToResults: 'Immediate tracking improvement',
        improvements: { connect: { id: leanmaxImp.id } },
      },
    });

    await prisma.product.create({
      data: {
        name: 'Gua Sha Facial Tool',
        brand: 'Mount Lai',
        category: 'device',
        subcategory: 'facial_massage',
        priceMin: 28,
        priceMax: 40,
        purchaseUrls: '["https://www.amazon.com/dp/B07B8XJDJM", "https://www.sephora.com"]',
        imageUrl: 'https://m.media-amazon.com/images/I/51CKhCIj7EL._AC_SL1500_.jpg',
        effectivenessRating: 6.0,
        riskLevel: 'low',
        usageInstructions: 'Use with oil, scrape in upward motions for 5-10 minutes daily for lymphatic drainage.',
        timelineToResults: '2-4 weeks for reduced puffiness',
        improvements: { connect: { id: leanmaxImp.id } },
      },
    });
  }

  // SKINCARE PRODUCTS
  if (skincareImp) {
    await prisma.product.create({
      data: {
        name: 'CeraVe Foaming Facial Cleanser',
        brand: 'CeraVe',
        category: 'skincare',
        subcategory: 'cleanser',
        priceMin: 12,
        priceMax: 18,
        purchaseUrls: '["https://www.amazon.com/dp/B01N1LL62W", "https://www.target.com"]',
        imageUrl: 'https://m.media-amazon.com/images/I/61mVOLTfyhL._AC_SL1500_.jpg',
        activeIngredients: '["Ceramides", "Niacinamide", "Hyaluronic Acid"]',
        effectivenessRating: 8.5,
        riskLevel: 'low',
        usageInstructions: 'Use AM and PM, massage into wet skin, rinse thoroughly.',
        timelineToResults: '2-4 weeks',
        improvements: { connect: { id: skincareImp.id } },
      },
    });

    await prisma.product.create({
      data: {
        name: 'Tretinoin 0.025% Cream',
        brand: 'Prescription',
        category: 'skincare',
        subcategory: 'retinoid',
        priceMin: 20,
        priceMax: 100,
        purchaseUrls: '["https://www.curology.com", "https://www.apostrophe.com"]',
        imageUrl: 'https://www.curology.com/images/products/custom-formula.jpg',
        activeIngredients: '["Tretinoin 0.025%"]',
        effectivenessRating: 9.5,
        riskLevel: 'medium',
        requiresPrescription: true,
        usageInstructions: 'Apply pea-sized amount at night to dry skin. Start 2-3x/week, increase gradually.',
        timelineToResults: '3-6 months',
        sideEffects: '["Dryness", "Peeling", "Purging period", "Sun sensitivity"]',
        improvements: { connect: { id: skincareImp.id } },
      },
    });

    await prisma.product.create({
      data: {
        name: 'Differin Gel (Adapalene 0.1%)',
        brand: 'Differin',
        category: 'skincare',
        subcategory: 'retinoid',
        priceMin: 12,
        priceMax: 30,
        purchaseUrls: '["https://www.amazon.com/dp/B07L1PHSY9", "https://www.target.com"]',
        imageUrl: 'https://m.media-amazon.com/images/I/61VqG7q5b7L._AC_SL1500_.jpg',
        activeIngredients: '["Adapalene 0.1%"]',
        effectivenessRating: 8.5,
        riskLevel: 'low',
        usageInstructions: 'Apply at night. OTC alternative to tretinoin. Great for beginners.',
        timelineToResults: '3-6 months',
        sideEffects: '["Dryness", "Peeling", "Sun sensitivity"]',
        improvements: { connect: { id: skincareImp.id } },
      },
    });

    await prisma.product.create({
      data: {
        name: 'EltaMD UV Clear SPF 46',
        brand: 'EltaMD',
        category: 'skincare',
        subcategory: 'sun_protection',
        priceMin: 35,
        priceMax: 42,
        purchaseUrls: '["https://www.amazon.com/dp/B002MSN3QQ", "https://www.dermstore.com"]',
        imageUrl: 'https://m.media-amazon.com/images/I/51jMCYXoY7L._AC_SL1500_.jpg',
        activeIngredients: '["9% Zinc Oxide", "7.5% Octinoxate", "Niacinamide"]',
        effectivenessRating: 9.5,
        riskLevel: 'low',
        usageInstructions: 'Apply generously every morning as last step of skincare.',
        timelineToResults: 'Immediate protection',
        improvements: { connect: { id: skincareImp.id } },
      },
    });

    await prisma.product.create({
      data: {
        name: "Paula's Choice 2% BHA Liquid Exfoliant",
        brand: "Paula's Choice",
        category: 'skincare',
        subcategory: 'exfoliant',
        priceMin: 30,
        priceMax: 35,
        purchaseUrls: '["https://www.amazon.com/dp/B00949CTQQ", "https://www.paulaschoice.com"]',
        imageUrl: 'https://m.media-amazon.com/images/I/61-dMwBrBRL._AC_SL1500_.jpg',
        activeIngredients: '["2% Salicylic Acid (BHA)"]',
        effectivenessRating: 9.0,
        riskLevel: 'low',
        usageInstructions: 'Apply after cleansing. Start 2-3x/week, can use daily.',
        timelineToResults: '2-4 weeks',
        improvements: { connect: { id: skincareImp.id } },
      },
    });

    await prisma.product.create({
      data: {
        name: 'The Ordinary Niacinamide 10% + Zinc 1%',
        brand: 'The Ordinary',
        category: 'skincare',
        subcategory: 'serum',
        priceMin: 6,
        priceMax: 10,
        purchaseUrls: '["https://www.amazon.com/dp/B07RZLK4PF", "https://theordinary.com"]',
        imageUrl: 'https://m.media-amazon.com/images/I/51cS1x+f93L._AC_SL1500_.jpg',
        activeIngredients: '["Niacinamide 10%", "Zinc PCA 1%"]',
        effectivenessRating: 8.0,
        riskLevel: 'low',
        usageInstructions: 'Apply AM and/or PM. Helps with pores and oil control.',
        timelineToResults: '4-8 weeks',
        improvements: { connect: { id: skincareImp.id } },
      },
    });
  }

  // EYE PRODUCTS
  if (eyeImp || underEyeImp) {
    const eyeConnections = [];
    if (eyeImp) eyeConnections.push({ id: eyeImp.id });
    if (underEyeImp) eyeConnections.push({ id: underEyeImp.id });

    await prisma.product.create({
      data: {
        name: 'The Ordinary Caffeine Solution 5% + EGCG',
        brand: 'The Ordinary',
        category: 'skincare',
        subcategory: 'eye_care',
        priceMin: 7,
        priceMax: 12,
        purchaseUrls: '["https://www.amazon.com/dp/B06VSNV8VK", "https://theordinary.com"]',
        imageUrl: 'https://m.media-amazon.com/images/I/41J6H8CxyRL._AC_SL1500_.jpg',
        activeIngredients: '["Caffeine 5%", "EGCG"]',
        effectivenessRating: 7.0,
        riskLevel: 'low',
        usageInstructions: "Apply around eye area morning and night. Pat gently, don't rub.",
        timelineToResults: '2-4 weeks for puffiness',
        improvements: { connect: eyeConnections },
      },
    });

    await prisma.product.create({
      data: {
        name: 'Neutrogena Rapid Wrinkle Repair Eye Cream',
        brand: 'Neutrogena',
        category: 'skincare',
        subcategory: 'eye_care',
        priceMin: 18,
        priceMax: 28,
        purchaseUrls: '["https://www.amazon.com/dp/B004D2DR0Q", "https://www.target.com"]',
        imageUrl: 'https://m.media-amazon.com/images/I/71VVZZm7p3L._AC_SL1500_.jpg',
        activeIngredients: '["Retinol SA", "Hyaluronic Acid"]',
        effectivenessRating: 7.5,
        riskLevel: 'low',
        usageInstructions: 'Apply at night around eye area. Start every other night.',
        timelineToResults: '4-8 weeks',
        improvements: { connect: eyeConnections },
      },
    });
  }

  // HAIR PRODUCTS
  if (hairImp) {
    await prisma.product.create({
      data: {
        name: 'Kirkland Minoxidil 5% Solution',
        brand: 'Kirkland',
        category: 'haircare',
        subcategory: 'growth_stimulant',
        priceMin: 18,
        priceMax: 35,
        purchaseUrls: '["https://www.amazon.com/dp/B0019LWV2K", "https://www.costco.com"]',
        imageUrl: 'https://m.media-amazon.com/images/I/71Cl8mEGYxL._AC_SL1500_.jpg',
        activeIngredients: '["Minoxidil 5%"]',
        effectivenessRating: 7.5,
        riskLevel: 'low',
        usageInstructions: 'Apply 1ml to scalp twice daily. Can also use on beard.',
        timelineToResults: '4-6 months',
        sideEffects: '["Scalp irritation", "Initial shedding", "Unwanted facial hair"]',
        improvements: { connect: { id: hairImp.id } },
      },
    });

    await prisma.product.create({
      data: {
        name: 'Nizoral A-D Anti-Dandruff Shampoo',
        brand: 'Nizoral',
        category: 'haircare',
        subcategory: 'shampoo',
        priceMin: 12,
        priceMax: 18,
        purchaseUrls: '["https://www.amazon.com/dp/B00AINMFAC"]',
        imageUrl: 'https://m.media-amazon.com/images/I/61H2sDqlspL._AC_SL1500_.jpg',
        activeIngredients: '["Ketoconazole 1%"]',
        effectivenessRating: 7.0,
        riskLevel: 'low',
        usageInstructions: 'Use 2-3x per week. Leave on scalp for 3-5 minutes.',
        timelineToResults: '4-8 weeks',
        improvements: { connect: { id: hairImp.id } },
      },
    });

    await prisma.product.create({
      data: {
        name: 'Dr. Pen Ultima A6',
        brand: 'Dr. Pen',
        category: 'device',
        subcategory: 'microneedling',
        priceMin: 90,
        priceMax: 150,
        purchaseUrls: '["https://www.amazon.com/dp/B07GNSGN3X"]',
        imageUrl: 'https://m.media-amazon.com/images/I/61d0rA0e3iL._AC_SL1500_.jpg',
        effectivenessRating: 8.0,
        riskLevel: 'medium',
        usageInstructions: 'Use 1x weekly at 1.0-1.5mm depth on scalp. Sterilize before each use.',
        timelineToResults: '3-6 months',
        sideEffects: '["Redness", "Bleeding", "Infection if not sanitized"]',
        improvements: { connect: { id: hairImp.id } },
      },
    });
  }

  // CHEEKBONE PRODUCTS
  if (cheekImp) {
    await prisma.product.create({
      data: {
        name: 'Ice Roller for Face',
        brand: 'ESARORA',
        category: 'device',
        subcategory: 'facial_tool',
        priceMin: 8,
        priceMax: 15,
        purchaseUrls: '["https://www.amazon.com/dp/B01E8IZ4LE"]',
        imageUrl: 'https://m.media-amazon.com/images/I/71T0K8+1D8L._AC_SL1500_.jpg',
        effectivenessRating: 5.5,
        riskLevel: 'low',
        usageInstructions: 'Keep in freezer. Roll over face in morning to reduce puffiness.',
        timelineToResults: 'Immediate temporary effect',
        improvements: { connect: { id: cheekImp.id } },
      },
    });
  }

  console.log('  ✅ Created products with images and links');

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
