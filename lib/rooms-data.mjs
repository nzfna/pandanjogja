const unit = (code) => ({
  code, name: `Homestay ${code}`, building: 'Bangunan A–C', capacity: 4,
  description: 'Satu unit utuh di bangunan estetik: ruang tamu, ruang tengah, dapur, kamar mandi, jemuran, dan teras menghadap pandan. Tanpa AC.',
  facilities: [
    'Ruang tamu: bisa tambah kasur (add-on), meja kecil, kipas angin',
    'Ruang tengah: kasur king size, 2 bantal, 1 guling, selimut, kipas angin, cermin',
    'Dapur: alat makan & masak lengkap, kompor portabel + gas, wastafel cuci piring',
    'Kamar mandi: shower, bak tinggi, WC jongkok & duduk, alat mandi tipis',
    'Jemuran: besi jemur, hanger, sapu, serokan, pel, ember',
    'Teras dengan kursi, pemandangan pandan segar',
  ],
  tags: ['dapur', 'teras', 'kasur_besar', 'kasur_king', 'jemuran'],
  price_daily: 150000, price_weekly: 600000, price_monthly: 1500000,
});
export const ROOMS = [
  unit('A'), unit('B'), unit('C'),
  {
    code: 'D', name: 'Homestay D', building: 'Bangunan D', capacity: 3,
    description: 'Dua kamar tidur berukuran sama, lorong santai, dapur, area jemur, dan toilet.',
    facilities: [
      'Kamar 1: kasur single, jendela luar, lemari, kipas angin',
      'Kamar 2: kasur king, kipas angin, lemari besar',
      'Lorong: kursi besar yang bisa untuk tiduran',
      'Dapur: alat makan & masak lengkap, kompor portabel + gas, wastafel cuci piring',
      'Jemuran: mesin cuci 2 tabung, hanger, sapu, serokan, pel',
      'Kamar mandi: kran, ember kecil, WC duduk',
    ],
    tags: ['dapur', 'mesin_cuci', 'kasur_besar', 'kasur_king', 'lorong'],
    price_daily: 150000, price_weekly: 600000, price_monthly: 1500000,
  },
  {
    code: 'E', name: 'Kamar E', building: 'Bangunan E–G', capacity: 1,
    description: 'Kamar luas dengan pintu ke teras dan ke dapur. Berbagi dapur dan kamar mandi dengan kamar F.',
    facilities: [
      'Kasur single dengan dipan, bantal, guling, kipas angin',
      'Lemari plastik, meja & kursi belajar, jendela luar',
      'Pintu ke teras dan ke dapur',
      'Dapur: alat makan & masak lengkap, kompor portabel + gas, wastafel',
      'Kamar mandi luas: bak, kran wudhu, WC duduk, tiang jemur',
    ],
    tags: ['dapur', 'teras', 'meja_belajar', 'kamar_mandi_luas'],
    price_daily: null, price_weekly: null, price_monthly: null,
  },
  {
    code: 'F', name: 'Kamar F', building: 'Bangunan E–G', capacity: 1,
    description: 'Kamar lebih ringkas tapi nyaman, pintu langsung ke dapur. Berbagi dapur dan kamar mandi dengan kamar E.',
    facilities: [
      'Kasur single tanpa dipan, bantal, guling, kipas angin',
      'Lemari plastik, meja & kursi belajar, jendela luar',
      'Dapur: alat makan & masak lengkap, kompor portabel + gas, wastafel',
      'Kamar mandi luas: bak, kran wudhu, WC duduk, tiang jemur',
    ],
    tags: ['dapur', 'meja_belajar', 'kamar_mandi_luas'],
    price_daily: null, price_weekly: null, price_monthly: null,
  },
  {
    code: 'G', name: 'Kamar G', building: 'Bangunan E–G', capacity: 2,
    description: 'Kamar luas dengan kasur double dan pintu langsung ke teras halaman.',
    facilities: ['Kasur double, 2 bantal, 1 guling, kipas angin', 'Jendela luar', 'Pintu langsung ke teras halaman'],
    tags: ['teras', 'kasur_besar'],
    price_daily: null, price_weekly: null, price_monthly: null,
  },
];
