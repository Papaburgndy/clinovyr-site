#!/usr/bin/env python3
"""Generate comparison pages for Clinovyr."""

import os
import json

OUTPUT_DIR = "/sessions/funny-vibrant-thompson/mnt/Loot/medical-leads/seo-site/output"
COMPARE_DIR = os.path.join(OUTPUT_DIR, "compare")

COMPARISONS = [
    {
        "slug": "botox-vs-dysport",
        "title": "Botox vs. Dysport: Complete Comparison",
        "description": "Compare Botox and Dysport for wrinkle reduction. Learn about effectiveness, cost, results timeline, and which is right for you.",
        "h1": "Botox vs. Dysport: Which Wrinkle Treatment Is Best?",
        "category": "Anti-Aging",
        "item1": {
            "name": "Botox",
            "pros": ["FDA-approved since 1989", "Results visible in 3-7 days", "Lasts 3-4 months", "Spreads naturally", "Most providers experienced with"],
            "cons": ["More expensive ($300-400)", "Slightly longer onset time", "Requires more frequent appointments"]
        },
        "item2": {
            "name": "Dysport",
            "pros": ["Lower cost ($250-300)", "Faster results (24-48 hours)", "Spreads more widely", "Good for larger areas", "Newer formula"],
            "cons": ["Fewer experienced providers", "May not last as long (2.5-3 months)", "Less FDA history"]
        },
        "costComparison": {
            "item1": "$300-400 per treatment",
            "item2": "$250-300 per treatment"
        },
        "faqs": [
            {
                "q": "Which works faster, Botox or Dysport?",
                "a": "Dysport typically shows results in 24-48 hours, while Botox takes 3-7 days. However, both reach full results at 2 weeks."
            },
            {
                "q": "How long do results last?",
                "a": "Botox results last 3-4 months, while Dysport lasts 2.5-3 months. Results vary by metabolism."
            },
            {
                "q": "Is one more effective than the other?",
                "a": "Both are equally effective at reducing wrinkles. The difference is mainly in spread pattern and timeline."
            },
            {
                "q": "Can I switch between them?",
                "a": "Yes, many patients try both. Some prefer one over the other based on results and price."
            }
        ],
        "conclusion": "Choose Botox if you want the most studied option and are willing to wait 3-7 days for results. Choose Dysport if you want faster results and prefer treatments that spread more naturally to larger areas."
    },
    {
        "slug": "coolsculpting-vs-liposuction",
        "title": "CoolSculpting vs. Liposuction: Which Is Right for You?",
        "description": "Compare non-invasive CoolSculpting to surgical liposuction. Understand recovery time, results, cost, and ideal candidates.",
        "h1": "CoolSculpting vs. Liposuction: A Complete Comparison",
        "category": "Body Contouring",
        "item1": {
            "name": "CoolSculpting",
            "pros": ["Non-surgical", "No downtime", "No anesthesia needed", "Multiple treatments possible", "Natural-looking results", "FDA-approved"],
            "cons": ["Slower results (2-3 months)", "Multiple sessions often needed", "Works best for small areas", "Less dramatic reduction", "$2,000-4,000 per area"]
        },
        "item2": {
            "name": "Liposuction",
            "pros": ["Dramatic fat removal", "Faster results (6-8 weeks)", "Permanent results", "Works for large areas", "One-time procedure"],
            "cons": ["Surgical procedure", "2-4 week recovery", "Requires anesthesia", "Higher cost ($3,000-10,000)", "Risk of complications", "Scarring possible"]
        },
        "costComparison": {
            "item1": "$2,000-4,000 per area (multiple sessions)",
            "item2": "$3,000-10,000 (one procedure)"
        },
        "faqs": [
            {
                "q": "How long until I see results?",
                "a": "CoolSculpting takes 2-3 months, while liposuction shows results within 6-8 weeks with continued improvement for months."
            },
            {
                "q": "Can I return to work immediately?",
                "a": "With CoolSculpting, yes—no downtime. With liposuction, expect 2-4 weeks before returning to normal activities."
            },
            {
                "q": "How permanent are the results?",
                "a": "Both are permanent if you maintain your weight. Fat cells don't return to treated areas."
            },
            {
                "q": "Which is best for my situation?",
                "a": "Choose CoolSculpting for small problem areas and no downtime. Choose liposuction for larger areas and dramatic results."
            }
        ],
        "conclusion": "CoolSculpting is ideal for busy professionals wanting gradual improvement with zero downtime. Liposuction is best for those seeking dramatic results and willing to invest recovery time."
    },
    {
        "slug": "coolsculpting-vs-emsculpt",
        "title": "CoolSculpting vs. EMSculpt: Body Contouring Comparison",
        "description": "Compare fat-freezing CoolSculpting with muscle-building EMSculpt. Learn what each treats and which is right for you.",
        "h1": "CoolSculpting vs. EMSculpt: Which Treatment Does What?",
        "category": "Body Contouring",
        "item1": {
            "name": "CoolSculpting",
            "pros": ["Eliminates fat cells", "No surgery or downtime", "FDA-approved for fat loss", "Works on many body areas", "Permanent fat cell removal"],
            "cons": ["Slow results (2-3 months)", "Multiple sessions needed", "$2,000-4,000 per area", "Not for weight loss", "Requires patience"]
        },
        "item2": {
            "name": "EMSculpt",
            "pros": ["Builds muscle and burns fat", "Quick sessions (30 min)", "Visible results in 2-4 weeks", "No downtime", "Works on abs, glutes, arms", "FDA-approved"],
            "cons": ["More expensive per session", "Multiple sessions required (4-6)", "Not surgical fat removal", "Results fade without maintenance"]
        },
        "costComparison": {
            "item1": "$2,000-4,000 per area",
            "item2": "$4,000-8,000 for full treatment (4-6 sessions)"
        },
        "faqs": [
            {
                "q": "Can I do both treatments together?",
                "a": "Yes! Many patients combine them—CoolSculpting removes fat while EMSculpt builds muscle underneath for enhanced definition."
            },
            {
                "q": "How long do EMSculpt results last?",
                "a": "Results continue improving for 2-3 months after treatment. Maintenance sessions 1-2x yearly help maintain results."
            },
            {
                "q": "Which is better for belly fat?",
                "a": "CoolSculpting directly eliminates belly fat. EMSculpt builds abs muscles for better definition. Combined: optimal results."
            },
            {
                "q": "Do I need multiple sessions?",
                "a": "CoolSculpting: yes (multiple areas). EMSculpt: 4-6 sessions for best results, usually spaced 2 weeks apart."
            }
        ],
        "conclusion": "CoolSculpting is best for permanent fat elimination. EMSculpt is best for muscle definition and toning. For complete body sculpting, combine both."
    },
    {
        "slug": "botox-vs-fillers",
        "title": "Botox vs. Dermal Fillers: Complete Guide",
        "description": "Compare Botox and dermal fillers for anti-aging. Understand what each treats, cost, results, and how to choose.",
        "h1": "Botox vs. Fillers: Which Anti-Aging Treatment Is Right?",
        "category": "Anti-Aging",
        "item1": {
            "name": "Botox",
            "pros": ["Prevents new wrinkles", "Smooths dynamic lines", "Fast results (3-7 days)", "Lasts 3-4 months", "Affordable ($300-400)", "Non-invasive"],
            "cons": ["Doesn't fill existing lines", "Needs repeated injections", "Can look frozen if overdone", "Affects facial expression"]
        },
        "item2": {
            "name": "Fillers",
            "pros": ["Fills existing wrinkles", "Adds volume", "Immediate results", "Many types available", "Natural look possible", "Can last 6-12+ months"],
            "cons": ["More expensive ($600-1,500)", "Injection bruising/swelling", "Requires skill to look natural", "Dissolves over time", "Risk of migration"]
        },
        "costComparison": {
            "item1": "$300-400 per area",
            "item2": "$600-1,500 per syringe"
        },
        "faqs": [
            {
                "q": "Can I use both Botox and fillers?",
                "a": "Absolutely! Many patients do. Botox relaxes muscles while fillers add volume—they work together for optimal results."
            },
            {
                "q": "Which is better for fine lines?",
                "a": "Botox is better for fine dynamic lines (forehead, crow's feet). Fillers are better for deeper static wrinkles and loss of volume."
            },
            {
                "q": "How long do results last?",
                "a": "Botox: 3-4 months. Fillers: varies (6 months for hyaluronic acid, 12+ months for longer-lasting types)."
            },
            {
                "q": "Is one safer than the other?",
                "a": "Both are FDA-approved and safe when administered by qualified providers. Choose based on your specific concerns."
            }
        ],
        "conclusion": "Use Botox for prevention and dynamic lines. Use fillers for volume loss and deeper wrinkles. Many patients benefit from combining both."
    },
    {
        "slug": "invisalign-vs-braces",
        "title": "Invisalign vs. Traditional Braces: Complete Comparison",
        "description": "Compare clear aligners to traditional braces. Learn about cost, treatment time, comfort, and which works best.",
        "h1": "Invisalign vs. Braces: Which Teeth Straightening Is Best?",
        "category": "Orthodontics",
        "item1": {
            "name": "Invisalign",
            "pros": ["Nearly invisible", "Removable (easier eating/cleaning)", "More comfortable", "Fewer appointments", "No dietary restrictions", "Faster treatment (12-18 months avg)"],
            "cons": ["More expensive ($4,000-8,000)", "Requires discipline (16+ hours/day)", "Less effective for severe cases", "Can be lost/damaged", "Not suitable for all bite issues"]
        },
        "item2": {
            "name": "Traditional Braces",
            "pros": ["Very effective for all cases", "Can't be forgotten", "Treats severe misalignment", "Less expensive ($3,000-6,000)", "Faster in some cases", "Many color options"],
            "cons": ["Very visible", "Food restrictions (hard/sticky)", "More uncomfortable", "More frequent adjustments", "Takes 18-24 months", "Harder to clean teeth"]
        },
        "costComparison": {
            "item1": "$4,000-8,000 for full treatment",
            "item2": "$3,000-6,000 for full treatment"
        },
        "faqs": [
            {
                "q": "How long does treatment take?",
                "a": "Invisalign typically takes 12-18 months. Braces take 18-24 months. Both depend on complexity."
            },
            {
                "q": "Can Invisalign fix all bite problems?",
                "a": "Invisalign works for most cases, but severe underbites, overbites, or tooth rotations may require traditional braces."
            },
            {
                "q": "Which requires more maintenance?",
                "a": "Invisalign requires removing them for meals and cleaning. Braces require careful brushing and avoiding certain foods."
            },
            {
                "q": "Can adults use Invisalign?",
                "a": "Yes! Invisalign works for adults. It's actually popular with adults due to the discreet appearance."
            }
        ],
        "conclusion": "Choose Invisalign for discretion, comfort, and moderate cases. Choose braces for severe misalignment and maximum certainty."
    },
    {
        "slug": "laser-vs-ipl",
        "title": "Laser Hair Removal vs. IPL: Which Is Better?",
        "description": "Compare laser hair removal to IPL. Understand effectiveness, speed, cost, and which treatment works best.",
        "h1": "Laser vs. IPL Hair Removal: A Complete Comparison",
        "category": "Hair Removal",
        "item1": {
            "name": "Laser Hair Removal",
            "pros": ["More precise", "Faster treatment", "Better for darker skin", "More effective", "Fewer sessions needed (6-8)", "Longer results", "Works on all hair colors"],
            "cons": ["More expensive", "Can be uncomfortable", "Risk of burns", "Requires professional operator"]
        },
        "item2": {
            "name": "IPL (Intense Pulsed Light)",
            "pros": ["More affordable", "Less pain", "Good for light hair", "Faster sessions", "Less downtime", "Can be at-home"],
            "cons": ["Less effective", "More sessions needed (10-12)", "Doesn't work on dark skin", "Shorter results", "Doesn't work on red/blonde hair"]
        },
        "costComparison": {
            "item1": "$200-400 per session (6-8 sessions = $1,200-3,200)",
            "item2": "$150-300 per session (10-12 sessions = $1,500-3,600)"
        },
        "faqs": [
            {
                "q": "Is laser hair removal permanent?",
                "a": "Laser provides permanent reduction. Most people need occasional touch-ups, but results can last 1-2 years between treatments."
            },
            {
                "q": "Which is faster?",
                "a": "Laser is faster per session and requires fewer total sessions. IPL requires more sessions but each is slightly cheaper."
            },
            {
                "q": "Does it hurt?",
                "a": "Laser can be uncomfortable but tolerable. IPL is generally less painful. Both improve with numbing cream."
            },
            {
                "q": "Can I use at-home devices?",
                "a": "At-home IPL devices are available but much less effective. Professional laser/IPL is significantly better."
            }
        ],
        "conclusion": "Choose laser for faster, more effective results on dark hair. Choose IPL for budget-conscious options and light hair removal."
    },
    {
        "slug": "med-spa-vs-plastic-surgeon",
        "title": "Med Spa vs. Plastic Surgeon: How to Choose",
        "description": "Compare med spas to plastic surgeons. Learn about procedures, credentials, costs, and what each specializes in.",
        "h1": "Med Spa vs. Plastic Surgeon: Which Provider Is Right?",
        "category": "Provider Selection",
        "item1": {
            "name": "Med Spa",
            "pros": ["Lower costs", "Non-surgical treatments", "Quick appointments", "Minimal downtime", "Good for maintenance/prevention", "More accessible", "No anesthesia needed"],
            "cons": ["Less trained staff", "Limited scope", "Variable quality", "Not for surgical needs", "Less regulated", "Results less dramatic"]
        },
        "item2": {
            "name": "Plastic Surgeon",
            "pros": ["Board-certified", "Surgical expertise", "Dramatic transformations", "Handles complications", "More regulated", "Extensive training", "Insurance may cover"],
            "cons": ["Much more expensive", "Requires surgery", "Longer recovery", "More risks", "Fewer appointments available", "May not do small procedures"]
        },
        "costComparison": {
            "item1": "$100-1,000 per treatment",
            "item2": "$2,000-15,000+ for surgery"
        },
        "faqs": [
            {
                "q": "When should I see a plastic surgeon?",
                "a": "See a plastic surgeon for surgical procedures, dramatic results, or complex body changes. See med spas for maintenance and non-invasive treatments."
            },
            {
                "q": "Are med spa providers trained?",
                "a": "Training varies. Some staff are highly trained nurses or aestheticians. Always verify credentials."
            },
            {
                "q": "Can I get surgical results at a med spa?",
                "a": "No. Med spas only perform non-surgical treatments. True surgical changes require a surgeon."
            },
            {
                "q": "Is one safer than the other?",
                "a": "Both are safe when done properly. Plastic surgeons have more extensive training for complex procedures."
            }
        ],
        "conclusion": "Choose a med spa for non-invasive treatments, maintenance, and affordability. Choose a plastic surgeon for surgical results and dramatic transformations."
    },
    {
        "slug": "hair-transplant-vs-prp",
        "title": "Hair Transplant vs. PRP Therapy: Which Works?",
        "description": "Compare surgical hair transplants to PRP injections for hair loss. Understand results, cost, and effectiveness.",
        "h1": "Hair Transplant vs. PRP: Which Hair Loss Treatment Works?",
        "category": "Hair Restoration",
        "item1": {
            "name": "Hair Transplant",
            "pros": ["Most effective for baldness", "Permanent results", "Natural-looking", "One-time procedure", "Covered by appearance goals", "Proven success rate"],
            "cons": ["Expensive ($4,000-15,000)", "Surgical procedure", "Recovery time (2-3 weeks)", "Requires good donor hair", "Visible scarring possible", "Risk of complications"]
        },
        "item2": {
            "name": "PRP (Platelet-Rich Plasma)",
            "pros": ["Non-surgical", "Natural (uses own blood)", "Minimal downtime", "Stimulates growth", "Works for thinning hair", "Lower cost ($1,500-3,000)"],
            "cons": ["Results variable", "Not for complete baldness", "Multiple sessions needed (3-6)", "Results take 3-6 months", "Costs add up", "Not permanent"]
        },
        "costComparison": {
            "item1": "$4,000-15,000 for one transplant",
            "item2": "$300-600 per session x 3-6 sessions = $900-3,600"
        },
        "faqs": [
            {
                "q": "Can I combine both treatments?",
                "a": "Yes! PRP after transplant can improve graft survival and speed healing. Many surgeons recommend it."
            },
            {
                "q": "How long before I see hair growth?",
                "a": "Transplants: 3-6 months. PRP: 3-6 months. Both require patience for full results."
            },
            {
                "q": "Is the transplanted hair permanent?",
                "a": "Yes. Transplanted hair is permanent because it comes from genetically resistant areas."
            },
            {
                "q": "Does PRP really work?",
                "a": "PRP shows promise for hair thinning and may slow loss, but results are less dramatic than transplants."
            }
        ],
        "conclusion": "Choose hair transplant for permanent baldness solutions. Choose PRP for early hair loss or to enhance transplant results."
    },
    {
        "slug": "lasik-vs-prk",
        "title": "LASIK vs. PRK Eye Surgery: Complete Comparison",
        "description": "Compare LASIK and PRK vision correction surgery. Learn about recovery, results, cost, and which is right for you.",
        "h1": "LASIK vs. PRK: Which Vision Correction Surgery Is Best?",
        "category": "Eye Surgery",
        "item1": {
            "name": "LASIK",
            "pros": ["Faster recovery (1-2 days)", "Less discomfort", "Better vision quickly", "No bandage needed", "Can treat higher prescriptions", "More popular/experienced surgeons"],
            "cons": ["Requires corneal thickness", "Dry eye risk", "Higher cost ($2,000-3,000 per eye)", "Not for all patients", "Flap complications possible"]
        },
        "item2": {
            "name": "PRK",
            "pros": ["Works for thin corneas", "No flap complications", "Good for active people", "Lower cost ($1,500-2,500 per eye)", "Suitable for more patients", "Fewer restrictions"],
            "cons": ["Longer recovery (1-2 weeks)", "More discomfort initially", "Slower vision improvement", "Requires eye drops", "Delayed work return", "More infections possible"]
        },
        "costComparison": {
            "item1": "$2,000-3,000 per eye",
            "item2": "$1,500-2,500 per eye"
        },
        "faqs": [
            {
                "q": "How long until I see clearly?",
                "a": "LASIK: 24 hours for most, 1 week for full vision. PRK: 3-5 days for functional, 1-2 weeks for full clarity."
            },
            {
                "q": "Which is safer?",
                "a": "Both are safe. LASIK has faster recovery; PRK has fewer flap-related risks. Success rates are comparable."
            },
            {
                "q": "Can I play sports after surgery?",
                "a": "LASIK: 1-2 weeks. PRK: 3-4 weeks due to the corneal scraping and longer healing."
            },
            {
                "q": "Which should I choose?",
                "a": "Choose LASIK for fast recovery and comfort. Choose PRK if you have thin corneas or want to avoid flap risks."
            }
        ],
        "conclusion": "LASIK is best for most patients seeking fast visual recovery. PRK is ideal for thin-cornea candidates and those avoiding flap risks."
    },
    {
        "slug": "chemical-peel-vs-microdermabrasion",
        "title": "Chemical Peel vs. Microdermabrasion: Skin Comparison",
        "description": "Compare chemical peels to microdermabrasion for skin rejuvenation. Learn about depth, results, downtime, and cost.",
        "h1": "Chemical Peel vs. Microdermabrasion: Which Skin Treatment?",
        "category": "Skin Treatments",
        "item1": {
            "name": "Chemical Peel",
            "pros": ["Works for all skin types", "Addresses many concerns", "Deeper penetration", "Better for age spots", "Dramatic results", "Addresses acne scars"],
            "cons": ["More downtime (1-2 weeks)", "Visible peeling", "Higher cost ($300-600)", "Risk of scarring", "Dark skin concerns", "Recovery visible"]
        },
        "item2": {
            "name": "Microdermabrasion",
            "pros": ["Minimal downtime", "No visible peeling", "Gentle option", "Safe for dark skin", "Works for fine lines", "Quick procedure (30 min)"],
            "cons": ["Superficial only", "Multiple sessions needed", "Less dramatic results", "Doesn't address deep scars", "Variable effectiveness"]
        },
        "costComparison": {
            "item1": "$300-600 per session (1-2 sessions)",
            "item2": "$150-300 per session (4-6 sessions needed)"
        },
        "faqs": [
            {
                "q": "Which has more downtime?",
                "a": "Chemical peels require 1-2 weeks visible recovery. Microdermabrasion has minimal downtime (redness only)."
            },
            {
                "q": "Can I combine them?",
                "a": "Yes. Light microdermabrasion before a peel can enhance penetration."
            },
            {
                "q": "Which is better for dark skin?",
                "a": "Microdermabrasion is safer. Chemical peels (especially stronger ones) risk pigmentation issues on dark skin."
            },
            {
                "q": "How long until results appear?",
                "a": "Chemical peels: 2-3 weeks after peeling. Microdermabrasion: gradual over 4-6 sessions."
            }
        ],
        "conclusion": "Choose chemical peels for dramatic results and don't mind downtime. Choose microdermabrasion for minimal downtime and gentle maintenance."
    },
    {
        "slug": "dental-implants-vs-veneers",
        "title": "Dental Implants vs. Veneers: Which Dental Treatment?",
        "description": "Compare dental implants to veneers for smile restoration. Learn about durability, cost, procedure, and results.",
        "h1": "Dental Implants vs. Veneers: Which Smile Solution Works?",
        "category": "Dental",
        "item1": {
            "name": "Dental Implants",
            "pros": ["Permanent solution", "Replace entire tooth", "Prevent bone loss", "Natural function", "Last 20-30+ years", "No damage to adjacent teeth", "Strongest option"],
            "cons": ["Most expensive ($1,500-6,000)", "Requires surgery", "3-6 months healing", "Bone grafts may be needed", "More maintenance", "Complex procedure"]
        },
        "item2": {
            "name": "Veneers",
            "pros": ["Fix cosmetic issues only", "Quick process (2-3 visits)", "Affordable ($500-1,500)", "No surgery needed", "Dramatic smile change", "Preserve natural tooth"],
            "cons": ["Require prep (irreversible)", "Last 10-15 years", "Can chip/break", "Not for missing teeth", "Tooth still decays underneath", "Replacement needed"]
        },
        "costComparison": {
            "item1": "$1,500-6,000 per tooth (one-time)",
            "item2": "$500-1,500 per tooth (lasts 10-15 years)"
        },
        "faqs": [
            {
                "q": "Which lasts longer?",
                "a": "Implants last 20-30+ years. Veneers last 10-15 years. Implants are permanent; veneers need replacement."
            },
            {
                "q": "Can I get both?",
                "a": "Yes. Use implants for missing teeth and veneers on remaining teeth for a cohesive smile."
            },
            {
                "q": "Which is better for smile makeovers?",
                "a": "For cosmetics: veneers. For missing teeth: implants. For full smile redesign: both combined."
            },
            {
                "q": "Do they feel natural?",
                "a": "Both feel natural when done well. Implants function like real teeth; veneers are purely cosmetic."
            }
        ],
        "conclusion": "Choose implants for missing teeth or long-term solutions. Choose veneers for cosmetic smile improvements."
    },
    {
        "slug": "hormone-therapy-types",
        "title": "HRT Types: Pellets vs. Injections vs. Creams",
        "description": "Compare hormone therapy delivery methods. Learn about effectiveness, cost, convenience, and side effects.",
        "h1": "Hormone Therapy Options: Pellets, Injections, and Creams Explained",
        "category": "Hormone Therapy",
        "item1": {
            "name": "Pellet Therapy",
            "pros": ["Set and forget (3-6 months)", "Consistent hormone levels", "No daily application", "Smaller doses needed", "Most natural feeling", "Better compliance"],
            "cons": ["Higher upfront cost ($600-1,200)", "Requires implant surgery", "Difficult to adjust", "Pellet extrusion possible", "Not reversible immediately"]
        },
        "item2": {
            "name": "Injections",
            "pros": ["Effective hormone delivery", "Adjustable dosing", "Cost-effective", "No daily routine", "Reversible", "Flexible timing"],
            "cons": ["Weekly/monthly injections", "Injection anxiety", "Hormone fluctuations", "Must store properly", "Requires clinic visits", "Skin irritation possible"]
        },
        "costComparison": {
            "item1": "$600-1,200 per implant (3-6 months)",
            "item2": "$100-300 per injection (weekly/monthly)",
            "item3": "$30-100 per month"
        },
        "faqs": [
            {
                "q": "Which delivery method is most effective?",
                "a": "All are effective when dosed properly. Pellets provide most consistent levels; injections/creams are adjustable."
            },
            {
                "q": "How long until I feel results?",
                "a": "Pellets: 2-4 weeks. Injections: 1-2 weeks. Creams: 3-7 days. All continue improving for 3 months."
            },
            {
                "q": "Can I switch between methods?",
                "a": "Yes, though there's a transition period. Most doctors recommend waiting 2-4 weeks when switching."
            },
            {
                "q": "Which is most affordable long-term?",
                "a": "Creams are cheapest upfront. Pellets are most cost-effective long-term when you factor in consistency and fewer doctor visits."
            }
        ],
        "conclusion": "Choose pellets for set-and-forget convenience. Choose injections for flexibility and adjustability. Choose creams for budget and full control."
    },
]

FOOTER_HTML = """<footer>
<div class="footer-grid">
  <div>
    <div class="footer-logo">🏥 Clinovyr</div>
    <p class="footer-desc">Helping patients in top US cities find trusted medical and aesthetic providers since 2026.</p>
  </div>
  <div>
    <div class="footer-heading">Services</div>
    <ul class="footer-links">
      <li><a href="/services/dentist/">Dentist</a></li>
      <li><a href="/services/med-spa/">Med Spa</a></li>
      <li><a href="/services/botox-fillers/">Botox & Fillers</a></li>
      <li><a href="/services/plastic-surgery/">Plastic Surgery</a></li>
      <li><a href="/services/dermatologist/">Dermatologist</a></li>
      <li><a href="/services/laser-hair-removal/">Laser Hair Removal</a></li>
    </ul>
  </div>
  <div>
    <div class="footer-heading">Compare Treatments</div>
    <ul class="footer-links">
      <li><a href="/compare/">All Comparisons</a></li>
      <li><a href="/compare/botox-vs-dysport/">Botox vs. Dysport</a></li>
      <li><a href="/compare/coolsculpting-vs-liposuction/">CoolSculpting vs. Liposuction</a></li>
    </ul>
  </div>
  <div>
    <div class="footer-heading">Company</div>
    <ul class="footer-links">
      <li><a href="/about.html">About Us</a></li>
      <li><a href="/contact.html">Contact</a></li>
      <li><a href="/privacy.html">Privacy Policy</a></li>
      <li><a href="/terms.html">Terms of Use</a></li>
    </ul>
  </div>
</div>
<div class="footer-bottom">
  © 2026 Clinovyr. All rights reserved. | Medical information is for informational purposes only. Always consult a qualified healthcare provider.
</div>
</footer>"""

def build_comparison_table(comparison):
    """Build HTML for side-by-side comparison table."""
    item1 = comparison["item1"]
    item2 = comparison["item2"]

    table = '<table class="comparison-table">'
    table += '<tr><th>Feature</th><th>' + item1["name"] + '</th><th>' + item2["name"] + '</th></tr>'

    # Determine max pros/cons
    max_items = max(len(item1.get("pros", [])), len(item2.get("pros", [])))

    table += '<tr><td colspan="3"><strong>Pros</strong></td></tr>'
    for i in range(max_items):
        table += '<tr>'
        table += '<td></td>'
        table += '<td>' + (item1["pros"][i] if i < len(item1.get("pros", [])) else '') + '</td>'
        table += '<td>' + (item2["pros"][i] if i < len(item2.get("pros", [])) else '') + '</td>'
        table += '</tr>'

    max_items = max(len(item1.get("cons", [])), len(item2.get("cons", [])))
    table += '<tr><td colspan="3"><strong>Cons</strong></td></tr>'
    for i in range(max_items):
        table += '<tr>'
        table += '<td></td>'
        table += '<td>' + (item1["cons"][i] if i < len(item1.get("cons", [])) else '') + '</td>'
        table += '<td>' + (item2["cons"][i] if i < len(item2.get("cons", [])) else '') + '</td>'
        table += '</tr>'

    table += '</table>'
    return table

def build_faq_schema(comparison):
    """Build JSON-LD FAQ schema."""
    faqs = comparison.get("faqs", [])

    faq_items = []
    for faq in faqs:
        faq_items.append({
            "@type": "Question",
            "name": faq["q"],
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq["a"]
            }
        })

    return json.dumps({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faq_items
    }, indent=2)

def create_comparison_page(comparison):
    """Create a single comparison page."""
    slug = comparison["slug"]
    title = comparison["title"]
    description = comparison["description"]
    h1 = comparison["h1"]
    category = comparison.get("category", "")
    item1 = comparison["item1"]
    item2 = comparison["item2"]
    costComparison = comparison.get("costComparison", {})
    faqs = comparison.get("faqs", [])
    conclusion = comparison.get("conclusion", "")

    faq_schema = build_faq_schema(comparison)
    comparison_table = build_comparison_table(comparison)

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<link rel="dns-prefetch" href="//fonts.googleapis.com">
<link rel="dns-prefetch" href="//fonts.gstatic.com">
<link rel="dns-prefetch" href="//www.googletagmanager.com">
<meta charset="UTF-8">
<meta name="theme-color" content="#2563eb">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} — Clinovyr</title>
<meta name="description" content="{description}">
<link rel="canonical" href="https://clinovyr.com/compare/{slug}/">
<meta property="og:title" content="{title} — Clinovyr">
<meta property="og:description" content="{description}">
<meta property="og:image" content="/images/og-services.jpg">
<meta property="og:type" content="website">
<meta property="og:url" content="https://clinovyr.com/compare/{slug}/">
<meta name="robots" content="index, follow">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root {{
  --blue: #2563eb; --blue-light: #3b82f6; --blue-dark: #1d4ed8;
  --sky: #0ea5e9; --gray-50: #f9fafb; --gray-100: #f3f4f6;
  --gray-200: #e5e7eb; --gray-600: #4b5563; --gray-900: #111827;
  --green: #10b981; --white: #ffffff;
}}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
body {{ font-family: 'Inter', -apple-system, system-ui, sans-serif; color: var(--gray-900); line-height: 1.6; }}
a {{ color: var(--blue); text-decoration: none; }}
a:hover {{ text-decoration: underline; }}
.container {{ max-width: 1100px; margin: 0 auto; padding: 0 20px; }}

/* Nav */
nav {{ background: var(--white); border-bottom: 1px solid var(--gray-200); position: sticky; top: 0; z-index: 100; }}
.nav-inner {{ display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; max-width: 1100px; margin: 0 auto; }}
.nav-logo {{ font-size: 1.25rem; font-weight: 800; color: var(--blue); }}
.nav-links {{ display: flex; gap: 24px; font-size: 0.9rem; }}
.nav-cta {{ background: var(--blue); color: var(--white) !important; padding: 8px 18px; border-radius: 8px; font-weight: 600; }}
.nav-cta:hover {{ background: var(--blue-dark); text-decoration: none !important; }}

/* Hero */
.hero {{ background: linear-gradient(135deg, #1e40af 0%, #0284c7 100%); color: var(--white); padding: 60px 20px; }}
.hero h1 {{ font-size: 2.4rem; font-weight: 800; margin-bottom: 16px; line-height: 1.2; }}
.hero p {{ font-size: 1.1rem; opacity: 0.9; max-width: 600px; margin-bottom: 28px; }}
.breadcrumb {{ font-size: 0.82rem; color: rgba(255,255,255,0.8); margin-bottom: 16px; }}
.breadcrumb a {{ color: var(--white); opacity: 0.8; }}

/* Comparison Table */
.comparison-table {{ width: 100%; border-collapse: collapse; margin: 32px 0; }}
.comparison-table th {{ background: var(--gray-100); padding: 16px; text-align: left; font-weight: 700; border: 1px solid var(--gray-200); }}
.comparison-table td {{ padding: 14px 16px; border: 1px solid var(--gray-200); }}
.comparison-table tbody tr:hover {{ background: var(--gray-50); }}

/* Cost Comparison */
.cost-comparison {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 32px 0; }}
.cost-item {{ background: var(--gray-50); padding: 20px; border-radius: 12px; border: 1px solid var(--gray-200); }}
.cost-item strong {{ color: var(--blue); font-size: 1.1rem; }}

/* FAQ */
.faq-section {{ margin: 40px 0; }}
.faq-item {{ border-bottom: 1px solid var(--gray-200); padding: 20px 0; }}
.faq-q {{ font-weight: 700; margin-bottom: 12px; font-size: 1.05rem; cursor: pointer; }}
.faq-q:hover {{ color: var(--blue); }}
.faq-a {{ color: var(--gray-600); font-size: 0.95rem; line-height: 1.6; }}

/* Lead Form */
.lead-form-wrap {{ background: var(--white); border-radius: 16px; padding: 28px; max-width: 420px; box-shadow: 0 20px 60px rgba(0,0,0,0.2); margin: 0 auto; }}
.lead-form-wrap h3 {{ font-size: 1.1rem; font-weight: 700; margin-bottom: 4px; color: var(--gray-900); }}
.lead-form-wrap p {{ font-size: 0.82rem; color: var(--gray-600); margin-bottom: 18px; }}
.form-group {{ margin-bottom: 12px; }}
.form-group input, .form-group select {{ width: 100%; padding: 11px 14px; border: 1.5px solid var(--gray-200); border-radius: 8px; font-size: 0.9rem; outline: none; }}
.form-submit {{ width: 100%; background: var(--green); color: var(--white); border: none; padding: 13px; border-radius: 8px; font-size: 1rem; font-weight: 700; cursor: pointer; }}
.form-submit:hover {{ background: #059669; }}

/* Sections */
.section {{ padding: 60px 20px; }}
.section-alt {{ background: var(--gray-50); }}
.section-title {{ font-size: 1.8rem; font-weight: 800; margin-bottom: 16px; }}
.section-sub {{ color: var(--gray-600); margin-bottom: 32px; font-size: 1.05rem; }}

/* Footer */
footer {{ background: var(--gray-900); color: var(--white); padding: 40px 20px; margin-top: 60px; }}
.footer-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 32px; max-width: 1100px; margin: 0 auto 32px; }}
.footer-heading {{ font-weight: 700; margin-bottom: 16px; }}
.footer-links {{ list-style: none; }}
.footer-links li {{ margin-bottom: 8px; }}
.footer-links a {{ color: #cbd5e1; font-size: 0.9rem; }}
.footer-links a:hover {{ color: var(--white); }}
.footer-bottom {{ text-align: center; color: #94a3b8; font-size: 0.85rem; max-width: 1100px; margin: 0 auto; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; }}

@media (max-width: 768px) {{
  .hero h1 {{ font-size: 1.8rem; }}
  .comparison-table {{ font-size: 0.85rem; }}
  .comparison-table td {{ padding: 10px 8px; }}
}}
</style>
<script type="application/ld+json">
{faq_schema}
</script>
</head>
<body>
<nav>
<div class="nav-inner">
  <div class="nav-logo">🏥 Clinovyr</div>
  <div class="nav-links">
    <a href="/">Home</a>
    <a href="/services/">Services</a>
    <a href="/compare/">Compare</a>
    <a href="/blog/">Blog</a>
    <a href="/cities/">Cities</a>
  </div>
  <a href="#lead-form" class="nav-cta">Get Free Quotes</a>
</div>
</nav>

<section class="hero">
<div class="container">
  <div class="breadcrumb">
    <a href="/">Home</a> / <a href="/compare/">Comparisons</a> / {category}
  </div>
  <h1>{h1}</h1>
  <p>Detailed comparison to help you make an informed decision about which treatment is right for you.</p>
</div>
</section>

<section class="section">
<div class="container">
  <h2 class="section-title">Side-by-Side Comparison</h2>
  {comparison_table}

  <h2 class="section-title" style="margin-top: 48px;">Cost Comparison</h2>
  <div class="cost-comparison">
    <div class="cost-item">
      <strong>{item1["name"]}</strong>
      <p style="margin-top: 8px; color: var(--gray-600);">{costComparison.get("item1", "")}</p>
    </div>
    <div class="cost-item">
      <strong>{item2["name"]}</strong>
      <p style="margin-top: 8px; color: var(--gray-600);">{costComparison.get("item2", "")}</p>
    </div>
  </div>
</div>
</section>

<section class="section section-alt">
<div class="container">
  <h2 class="section-title">Which Is Right for You?</h2>
  <p class="section-sub">{conclusion}</p>
</div>
</section>

<section class="section">
<div class="container">
  <h2 class="section-title">Frequently Asked Questions</h2>
  <div class="faq-section">"""

    for faq in faqs:
        html += f"""    <div class="faq-item">
      <div class="faq-q">{faq["q"]}</div>
      <div class="faq-a">{faq["a"]}</div>
    </div>
"""

    html += f"""  </div>
</div>
</section>

<section class="section section-alt">
<div class="container">
  <h2 class="section-title" style="text-align: center; margin-bottom: 32px;">Ready to Get Started?</h2>
  <div class="lead-form-wrap">
    <h3>Find a Provider Near You</h3>
    <p>Get free quotes from top-rated providers in your area.</p>
    <form style="display: flex; flex-direction: column; gap: 12px;">
      <div class="form-group">
        <input type="text" placeholder="Your Name" required>
      </div>
      <div class="form-group">
        <input type="email" placeholder="Email Address" required>
      </div>
      <div class="form-group">
        <input type="tel" placeholder="Phone Number" required>
      </div>
      <div class="form-group">
        <select required>
          <option value="">Select Your City</option>
          <option value="new-york">New York, NY</option>
          <option value="los-angeles">Los Angeles, CA</option>
          <option value="chicago">Chicago, IL</option>
          <option value="houston">Houston, TX</option>
          <option value="phoenix">Phoenix, AZ</option>
        </select>
      </div>
      <button type="submit" class="form-submit">Get Free Quote</button>
      <p class="form-privacy" style="font-size: 0.7rem; color: var(--gray-600); text-align: center; margin-top: 8px;">
        We respect your privacy. Unsubscribe at any time.
      </p>
    </form>
  </div>
</div>
</section>

{FOOTER_HTML}
</body>
</html>"""

    # Create directory
    dir_path = os.path.join(COMPARE_DIR, slug)
    os.makedirs(dir_path, exist_ok=True)

    # Write file
    file_path = os.path.join(dir_path, "index.html")
    with open(file_path, 'w') as f:
        f.write(html)

    return file_path

def create_comparison_index():
    """Create the /compare/index.html hub page."""

    comparisons_list = ""
    for comp in COMPARISONS:
        comparisons_list += f"""    <a href="/compare/{comp["slug"]}/" style="text-decoration: none; color: inherit;">
      <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; transition: box-shadow 0.2s; cursor: pointer;">
        <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; color: #2563eb;">{comp["title"]}</h3>
        <p style="font-size: 0.9rem; color: #64748b;">{comp["description"]}</p>
        <div style="margin-top: 12px; font-size: 0.85rem; font-weight: 600; color: #2563eb;">Compare →</div>
      </div>
    </a>
"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<link rel="dns-prefetch" href="//fonts.googleapis.com">
<link rel="dns-prefetch" href="//fonts.gstatic.com">
<link rel="dns-prefetch" href="//www.googletagmanager.com">
<meta charset="UTF-8">
<meta name="theme-color" content="#2563eb">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Treatment Comparisons — Clinovyr</title>
<meta name="description" content="Compare popular medical and aesthetic treatments side-by-side. Botox vs Fillers, LASIK vs PRK, and more.">
<link rel="canonical" href="https://clinovyr.com/compare/">
<meta property="og:title" content="Treatment Comparisons — Clinovyr">
<meta property="og:description" content="Compare popular medical and aesthetic treatments side-by-side.">
<meta property="og:image" content="/images/og-services.jpg">
<meta property="og:type" content="website">
<meta property="og:url" content="https://clinovyr.com/compare/">
<meta name="robots" content="index, follow">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root {{
  --blue: #2563eb; --blue-light: #3b82f6; --blue-dark: #1d4ed8;
  --sky: #0ea5e9; --gray-50: #f9fafb; --gray-100: #f3f4f6;
  --gray-200: #e5e7eb; --gray-600: #4b5563; --gray-900: #111827;
  --green: #10b981; --white: #ffffff;
}}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
body {{ font-family: 'Inter', -apple-system, system-ui, sans-serif; color: var(--gray-900); line-height: 1.6; }}
a {{ color: var(--blue); text-decoration: none; }}
.container {{ max-width: 1100px; margin: 0 auto; padding: 0 20px; }}

/* Nav */
nav {{ background: var(--white); border-bottom: 1px solid var(--gray-200); position: sticky; top: 0; z-index: 100; }}
.nav-inner {{ display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; }}
.nav-logo {{ font-size: 1.25rem; font-weight: 800; color: var(--blue); }}
.nav-links {{ display: flex; gap: 24px; font-size: 0.9rem; }}
.nav-cta {{ background: var(--blue); color: var(--white) !important; padding: 8px 18px; border-radius: 8px; font-weight: 600; }}

/* Hero */
.hero {{ background: linear-gradient(135deg, #1e40af 0%, #0284c7 100%); color: var(--white); padding: 60px 20px; }}
.hero h1 {{ font-size: 2.4rem; font-weight: 800; margin-bottom: 16px; }}
.hero p {{ font-size: 1.1rem; opacity: 0.9; max-width: 600px; }}

/* Section */
.section {{ padding: 60px 20px; }}
.section-title {{ font-size: 1.8rem; font-weight: 800; margin-bottom: 32px; text-align: center; }}

/* Grid */
.comparisons-grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }}

/* Footer */
footer {{ background: var(--gray-900); color: var(--white); padding: 40px 20px; margin-top: 60px; }}
.footer-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 32px; max-width: 1100px; margin: 0 auto 32px; }}
.footer-heading {{ font-weight: 700; margin-bottom: 16px; }}
.footer-links {{ list-style: none; }}
.footer-links li {{ margin-bottom: 8px; }}
.footer-links a {{ color: #cbd5e1; font-size: 0.9rem; }}
.footer-bottom {{ text-align: center; color: #94a3b8; font-size: 0.85rem; max-width: 1100px; margin: 0 auto; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; }}
</style>
</head>
<body>
<nav>
<div class="nav-inner">
  <div class="nav-logo">🏥 Clinovyr</div>
  <div class="nav-links">
    <a href="/">Home</a>
    <a href="/services/">Services</a>
    <a href="/compare/">Compare</a>
    <a href="/blog/">Blog</a>
    <a href="/cities/">Cities</a>
  </div>
  <a href="/" class="nav-cta">Get Free Quotes</a>
</div>
</nav>

<section class="hero">
<div class="container">
  <h1>Compare Medical & Aesthetic Treatments</h1>
  <p>Side-by-side comparisons of popular procedures to help you make an informed decision.</p>
</div>
</section>

<section class="section">
<div class="container">
  <h2 class="section-title">Popular Comparisons</h2>
  <div class="comparisons-grid">
{comparisons_list}  </div>
</div>
</section>

{FOOTER_HTML}
</body>
</html>"""

    file_path = os.path.join(COMPARE_DIR, "index.html")
    with open(file_path, 'w') as f:
        f.write(html)

    return file_path

def main():
    """Generate all comparison pages."""
    print("Creating comparison pages...\n")

    # Create individual comparison pages
    for comparison in COMPARISONS:
        file_path = create_comparison_page(comparison)
        slug = comparison["slug"]
        print(f"✓ Created /compare/{slug}/")

    # Create index page
    index_path = create_comparison_index()
    print(f"\n✓ Created /compare/index.html")

    print(f"\nGenerated {len(COMPARISONS)} comparison pages successfully!")

if __name__ == "__main__":
    main()
