const TILES = [
  // الصف السفلي (الخانات من 0 إلى 10)
  { id: 0, name: "البداية (انطلاق)", nameEn: "GO", type: "go", color: "#4CAF50" },
  { id: 1, name: "شارع النخيل", nameEn: "Palm Ave", type: "property", group: "brown", price: 60, rent: [2, 10, 30, 90, 160, 250], houseCost: 50, color: "#8B4513" },
  { id: 2, name: "صندوق المجتمع", nameEn: "Community Chest", type: "chest", color: "#FFB300" },
  { id: 3, name: "شارع الياسمين", nameEn: "Jasmine Ave", type: "property", group: "brown", price: 60, rent: [4, 20, 60, 180, 320, 450], houseCost: 50, color: "#8B4513" },
  { id: 4, name: "ضريبة الدخل", nameEn: "Income Tax", type: "tax", amount: 200, color: "#F44336" },
  { id: 5, name: "محطة الشرق", nameEn: "East Railroad", type: "railroad", group: "rr", price: 200, rent: [25, 50, 100, 200], color: "#37474F" },
  { id: 6, name: "حي الروضة", nameEn: "Rawdah St", type: "property", group: "lightblue", price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, color: "#81D4FA" },
  { id: 7, name: "فرصة", nameEn: "Chance", type: "chance", color: "#FF7043" },
  { id: 8, name: "حي النزهة", nameEn: "Nuzha St", type: "property", group: "lightblue", price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, color: "#81D4FA" },
  { id: 9, name: "حي الزهور", nameEn: "Zuhur St", type: "property", group: "lightblue", price: 120, rent: [8, 40, 100, 300, 450, 600], houseCost: 50, color: "#81D4FA" },

  // الركن 10 (السجن / زيارة)
  { id: 10, name: "السجن / زيارة فقط", nameEn: "Jail / Visiting", type: "jail", color: "#78909C" },

  // العمود الأيسر (الخانات من 11 إلى 19)
  { id: 11, name: "حي الأندلس", nameEn: "Andalus St", type: "property", group: "pink", price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, color: "#F06292" },
  { id: 12, name: "شركة الكهرباء", nameEn: "Electric Co", type: "utility", group: "util", price: 150, color: "#FDD835" },
  { id: 13, name: "حي غرناطة", nameEn: "Granada St", type: "property", group: "pink", price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, color: "#F06292" },
  { id: 14, name: "حي إشبيلية", nameEn: "Seville St", type: "property", group: "pink", price: 160, rent: [12, 60, 180, 500, 700, 900], houseCost: 100, color: "#F06292" },
  { id: 15, name: "محطة الجنوب", nameEn: "South Railroad", type: "railroad", group: "rr", price: 200, rent: [25, 50, 100, 200], color: "#37474F" },
  { id: 16, name: "حي المروج", nameEn: "Muruj St", type: "property", group: "orange", price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, color: "#FF9800" },
  { id: 17, name: "صندوق المجتمع", nameEn: "Community Chest", type: "chest", color: "#FFB300" },
  { id: 18, name: "حي السليمانية", nameEn: "Sulaimaniya", type: "property", group: "orange", price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, color: "#FF9800" },
  { id: 19, name: "حي العليا", nameEn: "Olaya St", type: "property", group: "orange", price: 200, rent: [16, 80, 220, 600, 800, 1000], houseCost: 100, color: "#FF9800" },

  // الركن 20 (الموقف المجاني)
  { id: 20, name: "الموقف المجاني", nameEn: "Free Parking", type: "parking", color: "#26A69A" },

  // الصف العلوي (الخانات من 21 إلى 29)
  { id: 21, name: "حي الملقا", nameEn: "Malqa St", type: "property", group: "red", price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, color: "#E53935" },
  { id: 22, name: "فرصة", nameEn: "Chance", type: "chance", color: "#FF7043" },
  { id: 23, name: "حي الصحافة", nameEn: "Sahafa St", type: "property", group: "red", price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, color: "#E53935" },
  { id: 24, name: "حي حطين", nameEn: "Hittin St", type: "property", group: "red", price: 240, rent: [20, 100, 300, 750, 925, 1100], houseCost: 150, color: "#E53935" },
  { id: 25, name: "محطة الغرب", nameEn: "West Railroad", type: "railroad", group: "rr", price: 200, rent: [25, 50, 100, 200], color: "#37474F" },
  { id: 26, name: "حي الشاطئ", nameEn: "Shati St", type: "property", group: "yellow", price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, color: "#FDD835" },
  { id: 27, name: "حي الكورنيش", nameEn: "Corniche St", type: "property", group: "yellow", price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, color: "#FDD835" },
  { id: 28, name: "شركة المياه", nameEn: "Water Works", type: "utility", group: "util", price: 150, color: "#29B6F6" },
  { id: 29, name: "حي المرجان", nameEn: "Murjan St", type: "property", group: "yellow", price: 280, rent: [24, 120, 360, 850, 1025, 1200], houseCost: 150, color: "#FDD835" },

  // الركن 30 (اذهب إلى السجن فوراً)
  { id: 30, name: "اذهب إلى السجن!", nameEn: "Go to Jail", type: "gotojail", color: "#D32F2F" },

  // العمود الأيمن (الخانات من 31 إلى 39)
  { id: 31, name: "حي الفيروز", nameEn: "Fairouz St", type: "property", group: "green", price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, color: "#43A047" },
  { id: 32, name: "حي اللؤلؤ", nameEn: "Lu'lu St", type: "property", group: "green", price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, color: "#43A047" },
  { id: 33, name: "صندوق المجتمع", nameEn: "Community Chest", type: "chest", color: "#FFB300" },
  { id: 34, name: "حي الزمرد", nameEn: "Zumurrud St", type: "property", group: "green", price: 320, rent: [28, 150, 450, 1000, 1200, 1400], houseCost: 200, color: "#43A047" },
  { id: 35, name: "محطة الشمال", nameEn: "North Railroad", type: "railroad", group: "rr", price: 200, rent: [25, 50, 100, 200], color: "#37474F" },
  { id: 36, name: "فرصة (عجلة الحظ)", nameEn: "Chance & Wheel", type: "chance", color: "#FF7043" },
  { id: 37, name: "برج المملكة", nameEn: "Kingdom Tower", type: "property", group: "darkblue", price: 350, rent: [35, 175, 500, 1100, 1300, 1500], houseCost: 200, color: "#1E88E5" },
  { id: 38, name: "ضريبة الرفاهية", nameEn: "Luxury Tax", type: "tax", amount: 100, color: "#E91E63" },
  { id: 39, name: "برج العاصمة", nameEn: "Capital Tower", type: "property", group: "darkblue", price: 400, rent: [50, 200, 600, 1400, 1700, 2000], houseCost: 200, color: "#1E88E5" }
];

// حساب قيم الرهن وفك الرهن بفائدة 10%
TILES.forEach(t => {
  if (t.price) {
    t.mortgage = Math.floor(t.price / 2);
    t.unmortgage = Math.floor(t.mortgage * 1.1);
  }
});

const PROPERTY_GROUPS = {
  brown: [1, 3],
  lightblue: [6, 8, 9],
  pink: [11, 13, 14],
  orange: [16, 18, 19],
  red: [21, 23, 24],
  yellow: [26, 27, 29],
  green: [31, 32, 34],
  darkblue: [37, 39],
  rr: [5, 15, 25, 35],
  util: [12, 28]
};

const PLAYER_CONFIGS = [
  { id: 0, name: "القبعة الذهبية", token: "tophat", color: "#FFD700", metalness: 0.9, roughness: 0.15, avatar: "🎩", isAI: false },
  { id: 1, name: "السيارة الفضية", token: "car", color: "#E0E0E0", metalness: 0.85, roughness: 0.2, avatar: "🏎️", isAI: true },
  { id: 2, name: "الكلب البرونزي", token: "dog", color: "#CD7F32", metalness: 0.8, roughness: 0.25, avatar: "🐕", isAI: true },
  { id: 3, name: "السفينة الزمردية", token: "ship", color: "#00E676", metalness: 0.75, roughness: 0.2, avatar: "🚢", isAI: true }
];

const WHEEL_SEGMENTS = [
  { id: 1, label: "💰 كنز نقدي +$300", type: "cash", value: 300, color: "#FFC107" },
  { id: 2, label: "🏠 منزل مجاني", type: "free_house", value: 1, color: "#4CAF50" },
  { id: 3, label: "🎲 رمية إضافية", type: "extra_roll", value: 1, color: "#00BCD4" },
  { id: 4, label: "💎 الجائزة الكبرى +$500", type: "cash", value: 500, color: "#9C27B0" },
  { id: 5, label: "🛡️ درع حماية الإيجار", type: "shield", value: 1, color: "#3F51B5" },
  { id: 6, label: "🧲 سرقة 10% من المنافسين", type: "steal_cash", value: 0.10, color: "#FF5722" },
  { id: 7, label: "🚀 انطلاق مباشر +$200", type: "goto_go", value: 0, color: "#4CAF50" },
  { id: 8, label: "🎁 هدية الحظ +$150", type: "cash", value: 150, color: "#E91E63" }
];

const CHANCE_CARDS = [
  { text: "تقدّم مباشرة إلى نقطة البداية (احصل على $200)", action: "goto", tile: 0 },
  { text: "تقدّم إلى حي حطين (إذا مررت بالبداية احصل على $200)", action: "goto", tile: 24 },
  { text: "اذهب مباشرة إلى السجن! لا تمر بالبداية ولا تقبض $200", action: "goto_jail" },
  { text: "أرباح استثمارية مجزية في البورصة! استلم $150 من البنك", action: "cash", amount: 150 },
  { text: "مخالفة تجاوز السرعة في المدينة! ادفع $50 للبنك", action: "cash", amount: -50 },
  { text: "بطاقة الخروج المجاني من السجن (يمكنك الاحتفاظ بها)", action: "jail_card" },
  { text: "أعمال صيانة وترميم لكافة مبانيك! ادفع $25 لكل منزل و $100 لكل فندق", action: "repairs", house: 25, hotel: 100 },
  { text: "تقدّم إلى أقرب محطة قطار وادفع ضعف الإيجار لمالكها", action: "nearest_rr" },
  { text: "لقد فزت بمسابقة بناء المدن! استلم $100 من البنك", action: "cash", amount: 100 },
  { text: "عجلة الحظ الذهبية مفتوحة أمامك! دور العجلة الآن", action: "spin_wheel" }
];

const CHEST_CARDS = [
  { text: "خطأ بنكي لصالحك! استلم $200 من البنك", action: "cash", amount: 200 },
  { text: "رسوم استشارة طبية. ادفع $50", action: "cash", amount: -50 },
  { text: "استحقاق بوليصة التأمين السنوية. استلم $100", action: "cash", amount: 100 },
  { text: "يوم ميلادك السعيد! استلم $25 هدية من كل لاعب", action: "collect_all", amount: 25 },
  { text: "استرداد ضريبة الدخل السنوية. استلم $50 من البنك", action: "cash", amount: 50 },
  { text: "بطاقة الخروج المجاني من السجن (يمكنك استخدامها لاحقاً)", action: "jail_card" },
  { text: "اذهب إلى السجن فوراً! بأمر من الشرطة", action: "goto_jail" },
  { text: "تبرع خيري لبناء مستشفى الأطفال. ادفع $100", action: "cash", amount: -100 },
  { text: "أرباح أسهم الشركات المحلية. استلم $100", action: "cash", amount: 100 },
  { text: "فرصة تدوير عجلة الحظ الكبرى! دور العجلة واربح الجائزة", action: "spin_wheel" }
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { TILES, PROPERTY_GROUPS, PLAYER_CONFIGS, WHEEL_SEGMENTS, CHANCE_CARDS, CHEST_CARDS };
}
