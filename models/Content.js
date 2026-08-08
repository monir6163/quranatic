const mongoose = require("mongoose");
const { Schema } = mongoose;

const ProblemItem = new Schema(
  {
    title: { type: String, default: "" },
    description: { type: String, default: "" }
  },
  { _id: false }
);

const FaqItem = new Schema(
  {
    question: { type: String, default: "" },
    answer: { type: String, default: "" }
  },
  { _id: false }
);

const TestimonialItem = new Schema(
  {
    name: { type: String, default: "" },
    text: { type: String, default: "" },
    avatar: { type: String, default: "" }
  },
  { _id: false }
);

const ContentSchema = new Schema(
  {
    // Global site settings
    siteSettings: {
      siteName: { type: String, default: "কুরআনী রুকিয়াহ পেপার" },
      tagline: { type: String, default: "শারীরিক ও মানসিক রোগের জন্য পরীক্ষিত সমাধান।" },
      logo: { type: String, default: "" },
      badge: { type: String, default: "কুরআন সুন্নাহভিত্তিক — শরীয়াহসম্মত চিকিৎসা" },
      phone: { type: String, default: "01700000000" },
      whatsapp: { type: String, default: "https://wa.me/8801700000000" },
      duration: { type: String, default: "১০ দিন" },
      ctaText: { type: String, default: "অর্ডার করতে চাই →" },
      ctaLink: { type: String, default: "#order" },
      faviconOrLogoNote: { type: String, default: "" }
    },

    // Hero section
    hero: {
      eyebrow: { type: String, default: "কুরআন সুন্নাহভিত্তিক — শরীয়াহসম্মত চিকিৎসা" },
      titleBeforeHighlight: { type: String, default: "কালো জাদু - টোনা, বদনজর এবং শরীর বন্ধনের জন্য" },
      titleHighlight: { type: String, default: "কুরআনিক রুকিয়াহ" },
      description: {
        type: String,
        default:
          "কুফরি যাদুর মাধ্যমে প্রায় সকল ক্ষতি সম্ভব। অসুস্থ বানানো, বাধা রাখা, পাগল করা, বিচ্ছিন্ন করা বা সম্পর্ক ভেঙে দেওয়া সম্ভব। সাহাবাগণ কেরামগণ ধোঁয়া তাবিজের উপর নির্ভর করতেন না, তারা আল্লাহর উপর ভরসা রেখে কুরআন সুন্নাহভিত্তিক চিকিৎসা গ্রহণ করতেন।"
      },
      bulletsRaw: {
        type: String,
        default:
          "চিন্তার সমস্যা বা দুশ্চিন্তা থেকে মুক্তি\nমনের সন্দেহ বা অযথা প্রশ্চিতা থেকে মুক্তি\nযাদুর ঝিনের আছর থেকে মুক্তি\nকালোজাদু, বান, বদনজর থেকে মুক্তি\nসংসারে বরকত ফিরে আসার আশ্চর্য উপায়\nঘুমের সমস্যা থেকে মুক্তি"
      },
      videoUrl: { type: String, default: "" },
      videoThumbnail: { type: String, default: "" }
    },

    // Problems / "কিছু একটা ঠিক নেই" section
    problems: {
      eyebrow: { type: String, default: "আপনারও কি অনুভব হয়" },
      heading: { type: String, default: "কিছু একটা ঠিক নেই।" },
      items: {
        type: [ProblemItem],
        default: [
          {
            title: "১) বিয়ে আটকে থাকা / সংসারে অশান্তি",
            description: "সব ঠিক আছে... কিন্তু বিয়ে হচ্ছে না। অথবা বিয়ে হয়েছে— কিন্তু শান্তি নেই।"
          },
          {
            title: "২) রিজিক কমে যাওয়া / ব্যবসায় বা চাকরিতে বরকত না থাকা",
            description: "চেষ্টা করেন... কিন্তু উন্নতি হয় না। টাকা আসে, কিন্তু টেকে না।"
          },
          {
            title: "৩) ভয়, অস্থিরতা, ওয়াসওয়াসা (OCD টাইপ চিন্তা)",
            description: "দুশ্চিন্তা থামে না। ঘুমে সমস্যা। বুক ধড়ফড়। অযথা সন্দেহ।"
          },
          {
            title: "৪) জিন/জাদু/তাবিজের ভয়",
            description: "মনে হয় কেউ 'কিছু করেছে'— কারণ জীবনে হঠাৎ করে সব উল্টে যাচ্ছে বা থেমে আছে।"
          },
          {
            title: "৫) বাচ্চার ওপর বদনজর / কান্নাকাটি / ঘুমের সমস্যা",
            description: "বিশেষ করে ছোট বাচ্চাদের ক্ষেত্রে মা-বাবারা বদনজরের ভয় পান।"
          },
          {
            title: "রুকিয়াটা কি আসলে কুরআনে আছে?",
            description:
              "অবশ্যই আছে। আল্লাহ সুবহানাহু ওয়া তায়ালা কুরআনে বলেছেন— যখন তোমার প্রাণটা কণ্ঠাগত হয়ে যাবে, তখন তোমাকে কে রুকিয়াহ করে ভালো করবে?"
          }
        ]
      }
    },

    // "মানুষ শিফা খুঁজতে গিয়ে ঠকে যায়" solution section
    solution: {
      eyebrow: { type: String, default: "বাংলাদেশের সবচেয়ে বড় সমস্যা..." },
      heading: { type: String, default: "মানুষ শিফা খুঁজতে গিয়ে ঠকে যায়" },
      wrongWaysHeading: { type: String, default: "মানুষ যেদিকে যায়..." },
      wrongWaysRaw: {
        type: String,
        default: "ভুয়া আমল / কবিরাজ\nভয় দেখানো 'জিন ছাড়ানো' ব্যবসা\nআরবি রিটি\n'বড় জাদু' বলে টাকা নেওয়া"
      },
      note: {
        type: String,
        default:
          "একজন মুসলমান হিসেবে সবচেয়ে ভয়ংকর ব্যাপার হলো: শিফা খুঁজতে গিয়ে ধোঁকা খাওয়া নয়। তাই আমরা সঠিক আমলকে সহজ একটি গাইডে যা পড়লে আপনি নিজেই ঘরে বসে সঠিকভাবে চিকিৎসা করতে পারবেন।"
      },
      images: { type: [String], default: [] }
    },

    // "রুকিয়াহর শক্তি সুন্নাহভিত্তিক" why-us comparison section
    whyUs: {
      heading: { type: String, default: "রুকিয়াহর শক্তি সুন্নাহভিত্তিক..." },
      subheading: { type: String, default: "তবে সবার পক্ষে রুকিয়াহ করা সহজ না কারণ:" },
      struggleTitle: { type: String, default: "সহজ উপায় হলো:" },
      struggleItemsRaw: {
        type: String,
        default: "সময় হয় না\nউচ্চারণ নিয়ে ভয়\nসঠিক পদ্ধতি না থাকা\nক্লান্তি / সংসারের চাপ\nবাচ্চা/কাজের ব্যস্ততা\nনিয়ম হাতে রাখা কঠিন"
      },
      struggleBoxText: {
        type: String,
        default:
          "সহজ এডিবল কালি ব্যবহার করে ছাপানো রুকিয়াহ পেপার, যা শরীরের জন্য নিরাপদ। যা আপনি ঘরে বসেই সহজেই আমলগুলো মাধ্যমে গায়ে দেওয়া থেকে করতে পারবেন।"
      },
      oursTitle: { type: String, default: "কোরানী পেপার রুকিয়াহ পেপার কেন আলাদা?" },
      oursItemsRaw: {
        type: String,
        default:
          "শরিয়তসম্মতভাবে প্রস্তুত\nঅনেক যাচাইকৃত আয়াত\nআদিল কালি ও পানি দিয়ে তৈরি\nএডিবল কালি ব্যবহার করে ছাপানো\nসম্পূর্ণ যত্নসহ উপযোগী হালাল পেপার\nসাধারণ প্রিন্টিং কাগজ নয় যা শরীরের জন্য ক্ষতিকর"
      },
      oursNote: {
        type: String,
        default: "অনেকে 'রুকিয়াহ পেপার' নামে সাধারণ প্রিন্টিং কাগজ ও ক্ষতিকর কালি ব্যবহার করে, সেগুলো থেকে বিরত থাকুন..."
      }
    },

    // FAQ section
    faq: {
      eyebrow: { type: String, default: "কালো জাদু ও বদনজর থেকে রক্ষার সুন্নাহভিত্তিক চিকিৎসা" },
      heading: { type: String, default: "আপনার মনের প্রশ্ন এবং উত্তর" },
      items: {
        type: [FaqItem],
        default: [
          {
            question: "কিভাবে রুকিয়াহ করবো?",
            answer:
              "আপনার সমস্যার ধরন অনুযায়ী কুরআনমুল আয়াত দিয়ে এই রুকিয়াহ পেপার লেখা থাকবে, এবং ১০ টি রুকিয়াহ পেপার থাকবে। প্রতিটি ব্যবহার বিধিমালার চিরকুট দেওয়া থাকবে সেখানে নিয়মাবলী লেখা থাকবে যেভাবে আপনি সঠিকভাবে পালন করবেন, আমরা কুরিয়ারের মাধ্যমে পাঠিয়ে দিব বাসা এখন ডেলিভারিতে।"
          },
          {
            question: "ফলাফল কতদিনে পাওয়া যাবে?",
            answer:
              "কুরআন এবং হাদিসের আলোকে এবং আমাদের বাস্তবিত অভিজ্ঞতার আলোকে আপনি ৯/১০ দিনের মধ্যেই সমস্যার সমাধান শুরু হতে দেখবেন ইনশাআল্লাহ।"
          },
          {
            question: "গোপনীয়তা",
            answer:
              "আপনার তথ্য আমরা সম্পূর্ণ গোপনীয়তার সাথে রাখি। সব আলোচনা ব্যক্তিগতভাবে হয়।"
          }
        ]
      }
    },

    // Testimonials section
    testimonials: {
      heading: { type: String, default: "হাজারো সন্তুষ্ট গ্রাহকের আস্থা..." },
      subheading: { type: String, default: "আপনিও চাইলে আল্লাহর প্রতি ভরসা রেখে রুকিয়াহ করতে পারেন।" },
      items: {
        type: [TestimonialItem],
        default: [
          {
            name: "সন্তুষ্ট গ্রাহক",
            text:
              "আলহামদুলিল্লাহ, একটি কথা বলিয়া আমি যে আগে সাহায্য পারতাম না কিন্তু কালাকে আল্লাহর রহমতে পারছি, আমার মনের শক্তি ফিরে পেয়েছি।",
            avatar: ""
          }
        ]
      }
    },

    // Footer
    footer: {
      about: {
        type: String,
        default: "আল্লাহর ইচ্ছায় আমাদের পরিবার সাথী ও সেবা দিয়েছে, আপনিও উপকার পাবেন ইনশাআল্লাহ।"
      },
      note: { type: String, default: "সম্পূর্ণ শরীয়াহ সম্মত ও অনুমোদিত পদ্ধতি" },
      copyrightText: { type: String, default: "সর্বস্বত্ব সংরক্ষিত।" }
    }
  },
  { timestamps: true }
);

ContentSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({});
  }
  return doc;
};

module.exports = mongoose.model("Content", ContentSchema);
