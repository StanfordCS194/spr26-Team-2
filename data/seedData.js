// Static TreeView reference data — seeded into MongoDB on first run.

const ROOM_LABELS = {
  single: "Singles",
  one_room_double: "1-room doubles",
  two_room_double: "2-room doubles",
  one_room_triple: "1-room triples",
  two_room_triple: "2-room triples",
  three_room_triple: "3-room triples",
};

const DORM_EXTRA_TAGS = {
  ujamaa: ["theme:yes", "theme:ethnic", "location:central"],
  "casa-zapata": ["theme:yes", "theme:ethnic", "location:east"],
  okada: ["theme:yes", "theme:ethnic", "location:east"],
  burbank: ["theme:yes", "theme:academic", "location:east"],
  potter: ["theme:yes", "theme:academic", "location:west"],
  otero: ["theme:yes", "theme:academic", "location:east"],
  alondra: ["program:sle", "location:central"],
  cardenal: ["program:sle", "location:central"],
  zap: ["self-op", "vibe:cozy", "location:row"],
  "sally-ride": ["year:sophomore", "location:east"],
  branner: ["vibe:social", "location:east"],
  crothers: ["vibe:social", "location:central"],
  lantana: ["focus:service", "location:west"],
  "west-lagunita": ["location:central"],
  castano: ["location:west"],
  schiff: ["location:west"],
  robinson: ["location:west"],
  mirlo: ["location:central"],
  donner: ["location:east"],
  larkin: ["location:east"],
  arroyo: ["location:east"],
  cedro: ["location:east"],
  rinconada: ["location:east"],
  soto: ["location:east"],
  junipero: ["location:east"],
};

const COMMUNITY_BONUS = {
  ujamaa: 3,
  "casa-zapata": 3,
  okada: 3,
  burbank: 2,
  potter: 2,
  otero: 2,
  zap: 2,
  "sally-ride": 1,
  lantana: 1,
};

const REASON_LABELS = {
  "category:frosh": "First-year designated",
  "category:four_class": "Four-class undergraduate",
  "has:single": "offers singles",
  "has:one_room_double": "offers 1-room doubles",
  "has:two_room_double": "offers 2-room doubles",
  "has:one_room_triple": "offers 1-room triples",
  "has:two_room_triple": "offers 2-room triples",
  "has:three_room_triple": "offers 3-room triples",
  "variety:high": "lots of room type options",
  "variety:low": "simpler room type lineup",
  "theme:yes": "themed / focus house",
  "theme:no": "regular residence",
  "theme:ethnic": "ethnic / cultural theme house",
  "theme:academic": "academic theme house",
  "program:sle": "Structured Liberal Education program house",
  "focus:service": "community-service focus house",
  "self-op": "self-operated row house",
  "year:sophomore": "all-sophomore residence",
  "vibe:social": "big, social energy",
  "vibe:cozy": "cozy, close-knit",
  "location:east": "East Campus location",
  "location:central": "central-campus location",
  "location:west": "West Campus location",
  "location:row": "in The Row",
};

const RANKINGS_SORT_OPTIONS = [
  { key: "overall", label: "Overall" },
  { key: "variety", label: "Room variety" },
  { key: "proximity", label: "Closest to Quad" },
  { key: "community", label: "Community" },
];

const RANKINGS_FILTERS = [
  { key: "all", label: "All" },
  { key: "frosh", label: "First-year" },
  { key: "four_class", label: "Four-class" },
];

const MAIN_QUAD = { lat: 37.4275, lng: -122.17 };
const WALK_SPEED_KMH = 5;
const DETOUR_FACTOR = 1.3;

const LANDMARKS = [
  { name: "Main Quad", emoji: "🏛️", lat: 37.4275, lng: -122.17, sortOrder: 0 },
  { name: "Green Library", emoji: "📚", lat: 37.4264, lng: -122.1672, sortOrder: 1 },
  { name: "Arrillaga Dining", emoji: "🍽️", lat: 37.426, lng: -122.1736, sortOrder: 2 },
  { name: "Tresidder Union", emoji: "☕", lat: 37.4243, lng: -122.171, sortOrder: 3 },
  { name: "Maples Pavilion", emoji: "🏀", lat: 37.4347, lng: -122.161, sortOrder: 4 },
];

const QUIZ_QUESTIONS = [
  {
    order: 0,
    text: "Which year status are you applying for?",
    options: [
      { label: "First-year (mostly first-year residents)", tags: ["category:frosh"] },
      { label: "Four-class (any year, mixed students)", tags: ["category:four_class"] },
      { label: "Either is fine", tags: [] },
    ],
  },
  {
    order: 1,
    text: "How many people in your room?",
    options: [
      { label: "Just me — I want a single", tags: ["has:single"] },
      { label: "Me and one other — a double", tags: ["has:one_room_double", "has:two_room_double"] },
      { label: "Three of us — a triple", tags: ["has:one_room_triple", "has:two_room_triple", "has:three_room_triple"] },
      { label: "Flexible / not sure", tags: [] },
    ],
  },
  {
    order: 2,
    text: "If you're sharing, do you want one room or connected rooms?",
    options: [
      { label: "Everyone in one room together", tags: ["has:one_room_double", "has:one_room_triple"] },
      {
        label: "Separate connected rooms with a shared common area",
        tags: ["has:two_room_double", "has:two_room_triple", "has:three_room_triple"],
      },
      { label: "Doesn't matter to me", tags: [] },
    ],
  },
  {
    order: 3,
    text: "How much variety do you want in the building?",
    options: [
      { label: "Lots of options (4+ different room types in one building)", tags: ["variety:high"] },
      { label: "Simpler is fine (fewer room types per building)", tags: ["variety:low"] },
      { label: "No preference", tags: [] },
    ],
  },
  {
    order: 4,
    text: "Are you interested in a themed or focus community house?",
    options: [
      {
        label: "Yes — a cultural / ethnic theme house (Ujamaa, Casa Zapata, Okada)",
        tags: ["theme:yes", "theme:ethnic"],
      },
      {
        label: "Yes — an academic theme house (Burbank arts, Potter energy, Otero public service)",
        tags: ["theme:yes", "theme:academic"],
      },
      { label: "No, regular residence is what I want", tags: ["theme:no"] },
      { label: "Just show me what fits otherwise", tags: [] },
    ],
  },
  {
    order: 5,
    text: "What's your social vibe?",
    options: [
      { label: "Big, lively, lots of common-area energy", tags: ["vibe:social"] },
      { label: "Small, cozy, close-knit community", tags: ["vibe:cozy"] },
      { label: "Somewhere in the middle", tags: [] },
    ],
  },
  {
    order: 6,
    text: "Where on campus would you like to live?",
    options: [
      { label: "East Campus (Branner, Stern, Wilbur — near the science quad)", tags: ["location:east"] },
      { label: "Central (Lagunita, Florence Moore, Crothers — close to main quad)", tags: ["location:central"] },
      { label: "West Campus (Governor's Corner, Wisteria — quieter, near the foothills)", tags: ["location:west"] },
      { label: "The Row (smaller, character-rich houses)", tags: ["location:row"] },
      { label: "No preference", tags: [] },
    ],
  },
];

const DORM_COORDS = [
  { id: "branner", lat: 37.4255, lng: -122.1629 },
  { id: "crothers", lat: 37.4258, lng: -122.1647 },
  { id: "alondra", lat: 37.4222, lng: -122.1718 },
  { id: "mirlo", lat: 37.4218, lng: -122.1723 },
  { id: "castano", lat: 37.425, lng: -122.161 },
  { id: "lantana", lat: 37.4257, lng: -122.1608 },
  { id: "robinson", lat: 37.4254, lng: -122.1795 },
  { id: "schiff", lat: 37.4251, lng: -122.18 },
  { id: "west-lagunita", lat: 37.425, lng: -122.1768 },
  { id: "donner", lat: 37.4243, lng: -122.1662 },
  { id: "larkin", lat: 37.425, lng: -122.1658 },
  { id: "arroyo", lat: 37.4243, lng: -122.1626 },
  { id: "cedro", lat: 37.4241, lng: -122.1623 },
  { id: "rinconada", lat: 37.4238, lng: -122.164 },
  { id: "soto", lat: 37.4244, lng: -122.1639 },
  { id: "cardenal", lat: 37.422, lng: -122.1715 },
  { id: "potter", lat: 37.4256, lng: -122.1793 },
  { id: "ujamaa", lat: 37.4248, lng: -122.1758 },
  { id: "burbank", lat: 37.4242, lng: -122.1653 },
  { id: "zap", lat: 37.4213, lng: -122.1619 },
  { id: "casa-zapata", lat: 37.4239, lng: -122.1656 },
  { id: "sally-ride", lat: 37.424, lng: -122.1662 },
  { id: "junipero", lat: 37.4235, lng: -122.1624 },
  { id: "okada", lat: 37.4235, lng: -122.1629 },
  { id: "otero", lat: 37.4236, lng: -122.1637 },
];

const HOUSES = [
  { id: "branner", name: "Branner", category: "frosh", roomTypes: ["single", "one_room_double", "two_room_double", "one_room_triple", "two_room_triple"] },
  { id: "crothers", name: "Crothers", category: "frosh", roomTypes: ["single", "one_room_double", "two_room_double", "one_room_triple"] },
  { id: "alondra", name: "Alondra", category: "frosh", roomTypes: ["single", "one_room_double", "two_room_double"] },
  { id: "mirlo", name: "Mirlo", category: "frosh", roomTypes: ["single", "one_room_double"] },
  { id: "castano", name: "Castaño", category: "frosh", roomTypes: ["single", "one_room_double", "two_room_double", "one_room_triple", "two_room_triple", "three_room_triple"] },
  { id: "lantana", name: "Lantana", category: "frosh", roomTypes: ["single", "one_room_double", "two_room_double", "one_room_triple"] },
  { id: "robinson", name: "Robinson", category: "frosh", roomTypes: ["single", "one_room_double", "two_room_double", "one_room_triple", "three_room_triple"] },
  { id: "schiff", name: "Schiff", category: "frosh", roomTypes: ["single", "one_room_double", "two_room_double", "one_room_triple", "two_room_triple", "three_room_triple"] },
  { id: "west-lagunita", name: "West Lagunita", category: "frosh", roomTypes: ["single", "one_room_double", "two_room_double"] },
  { id: "donner", name: "Donner", category: "frosh", roomTypes: ["single", "one_room_double"] },
  { id: "larkin", name: "Larkin", category: "frosh", roomTypes: ["single", "one_room_double"] },
  { id: "arroyo", name: "Arroyo", category: "frosh", roomTypes: ["single", "one_room_double"] },
  { id: "cedro", name: "Cedro", category: "frosh", roomTypes: ["single", "one_room_double"] },
  { id: "rinconada", name: "Rinconada", category: "frosh", roomTypes: ["single", "one_room_double"] },
  { id: "soto", name: "Soto", category: "frosh", roomTypes: ["single", "one_room_double"] },
  { id: "cardenal", name: "Cardenal", category: "four_class", roomTypes: ["single", "one_room_double", "two_room_double"] },
  { id: "potter", name: "Potter", category: "four_class", roomTypes: ["single", "one_room_double", "two_room_double", "one_room_triple"] },
  { id: "ujamaa", name: "Ujamaa", category: "four_class", roomTypes: ["single", "one_room_double", "two_room_double"] },
  { id: "burbank", name: "Burbank", category: "four_class", roomTypes: ["single", "one_room_double"] },
  { id: "zap", name: "ZAP", category: "four_class", roomTypes: ["single", "one_room_double"] },
  { id: "casa-zapata", name: "Casa Zapata", category: "four_class", roomTypes: ["single", "one_room_double"] },
  { id: "sally-ride", name: "Sally Ride", category: "four_class", roomTypes: ["single", "one_room_double"] },
  { id: "junipero", name: "Junipero", category: "four_class", roomTypes: ["single", "one_room_double"] },
  { id: "okada", name: "Okada", category: "four_class", roomTypes: ["single", "one_room_double"] },
  { id: "otero", name: "Otero", category: "four_class", roomTypes: ["single", "one_room_double"] },
];

const TOUR_DORM_IDS = ["zap", "okada", "rinconada", "soto", "sally-ride", "lantana"];

function buildTourConfigs() {
  const baseScene = {
    type: "equirectangular",
    autoLoad: true,
    hfov: 70,
    minHfov: 50,
    maxHfov: 90,
    haov: 110,
    vaov: 45,
    vOffset: 0,
    yaw: 0,
    pitch: 0,
    minYaw: -55,
    maxYaw: 55,
    minPitch: -22,
    maxPitch: 22,
    avoidShowingBackground: true,
  };

  const withDefaults = (firstScene, scenes) => ({
    default: {
      firstScene,
      autoLoad: true,
      sceneFadeDuration: 800,
      showControls: true,
      showFullscreenCtrl: true,
      hotSpotDebug: false,
    },
    scenes,
  });

  const zapBase = "/photos/";
  const otherBase = "/dormPhotos/";
  const pano = (base, file) => base + file;

  return [
    {
      dormId: "zap",
      config: withDefaults("zapOne", {
        zapOne: { ...baseScene, title: "ZAP One", panorama: pano(zapBase, "ZAP_One.jpeg"), hotSpots: [{ pitch: 3.5, yaw: -18, type: "scene", text: "Go to ZAP Two", sceneId: "zapTwo" }] },
        zapTwo: { ...baseScene, title: "ZAP Two", panorama: pano(zapBase, "ZAP_Two.jpeg"), hotSpots: [{ pitch: 2, yaw: 45, type: "scene", text: "Back to ZAP One", sceneId: "zapOne" }, { pitch: 3, yaw: -42, type: "scene", text: "Go to ZAP Three", sceneId: "zapThree" }] },
        zapThree: { ...baseScene, title: "ZAP Three", panorama: pano(zapBase, "ZAP_Three.jpeg"), hotSpots: [{ pitch: 2, yaw: 45, type: "scene", text: "Back to ZAP Two", sceneId: "zapTwo" }, { pitch: 2, yaw: 24, type: "scene", text: "Go to ZAP Four", sceneId: "zapFour" }] },
        zapFour: { ...baseScene, title: "ZAP Four", panorama: pano(zapBase, "ZAP_Four.jpeg"), hotSpots: [{ pitch: 3, yaw: -31, type: "scene", text: "Back to ZAP Three", sceneId: "zapThree" }, { pitch: 3, yaw: 4, type: "scene", text: "Go to ZAP Five", sceneId: "zapFive" }] },
        zapFive: { ...baseScene, title: "ZAP Five", panorama: pano(zapBase, "ZAP_Five.jpeg"), hotSpots: [{ pitch: 3, yaw: 50, type: "scene", text: "Back to ZAP Four", sceneId: "zapFour" }] },
      }),
    },
    {
      dormId: "okada",
      config: withDefaults("okadaOne", {
        okadaOne: { ...baseScene, title: "Okada One", panorama: pano(otherBase, "okada_one.jpeg"), hotSpots: [{ pitch: 1.85, yaw: -1.13, type: "scene", text: "Go to Okada Two", sceneId: "okadaTwo" }] },
        okadaTwo: { ...baseScene, title: "Okada Two", panorama: pano(otherBase, "okada_two.jpeg"), hotSpots: [{ pitch: -2.42, yaw: 44.58, type: "scene", text: "Back to Okada One", sceneId: "okadaOne" }, { pitch: 1.21, yaw: -11.68, type: "scene", text: "Go to Okada Three", sceneId: "okadaThree" }] },
        okadaThree: { ...baseScene, title: "Okada Three", panorama: pano(otherBase, "okada_three.jpeg"), hotSpots: [{ pitch: 4.5, yaw: 26.95, type: "scene", text: "Back to Okada Two", sceneId: "okadaTwo" }] },
      }),
    },
    {
      dormId: "rinconada",
      config: withDefaults("rinconadaOne", {
        rinconadaOne: { ...baseScene, title: "Rinconada One", panorama: pano(otherBase, "rinconada_one.jpeg"), hotSpots: [{ pitch: 0.16, yaw: -9.22, type: "scene", text: "Go to Rinconada Two", sceneId: "rinconadaTwo" }] },
        rinconadaTwo: { ...baseScene, title: "Rinconada Two", panorama: pano(otherBase, "rinconada_two.jpeg"), hotSpots: [{ pitch: 2.31, yaw: 54.01, type: "scene", text: "Back to Rinconada One", sceneId: "rinconadaOne" }, { pitch: 0.4, yaw: -4.92, type: "scene", text: "Go to Rinconada Three", sceneId: "rinconadaThree" }] },
        rinconadaThree: { ...baseScene, title: "Rinconada Three", panorama: pano(otherBase, "rinconada_three.jpeg"), hotSpots: [{ pitch: 1.37, yaw: -19.98, type: "scene", text: "Back to Rinconada Two", sceneId: "rinconadaTwo" }] },
      }),
    },
    {
      dormId: "soto",
      config: withDefaults("sotoOne", {
        sotoOne: { ...baseScene, title: "Soto One", panorama: pano(otherBase, "soto_one.jpeg"), hotSpots: [{ pitch: 3.22, yaw: -10.97, type: "scene", text: "Go to Soto Two", sceneId: "sotoTwo" }] },
        sotoTwo: { ...baseScene, title: "Soto Two", panorama: pano(otherBase, "soto_two.jpeg"), hotSpots: [{ pitch: 0.75, yaw: 45.2, type: "scene", text: "Back to Soto One", sceneId: "sotoOne" }, { pitch: 2.54, yaw: -11.48, type: "scene", text: "Go to Soto Three", sceneId: "sotoThree" }] },
        sotoThree: { ...baseScene, title: "Soto Three", panorama: pano(otherBase, "soto_three.jpeg"), hotSpots: [{ pitch: 2.1, yaw: 9.12, type: "scene", text: "Back to Soto Two", sceneId: "sotoTwo" }] },
      }),
    },
    {
      dormId: "sally-ride",
      config: withDefaults("sallyRideOne", {
        sallyRideOne: { ...baseScene, title: "Sally Ride One", panorama: pano(otherBase, "sallyride_one.jpeg"), hotSpots: [{ pitch: 1.02, yaw: -24.9, type: "scene", text: "Go to Sally Ride Two", sceneId: "sallyRideTwo" }] },
        sallyRideTwo: { ...baseScene, title: "Sally Ride Two", panorama: pano(otherBase, "sallyride_two.jpeg"), hotSpots: [{ pitch: 1.33, yaw: 43.56, type: "scene", text: "Back to Sally Ride One", sceneId: "sallyRideOne" }, { pitch: 5.12, yaw: -35.15, type: "scene", text: "Go to Sally Ride Three", sceneId: "sallyRideThree" }] },
        sallyRideThree: { ...baseScene, title: "Sally Ride Three", panorama: pano(otherBase, "sallyride_three.jpeg"), hotSpots: [{ pitch: 8.74, yaw: 28.08, type: "scene", text: "Back to Sally Ride Two", sceneId: "sallyRideTwo" }] },
      }),
    },
    {
      dormId: "lantana",
      config: withDefaults("lantanaOne", {
        lantanaOne: { ...baseScene, title: "Lantana One", panorama: pano(otherBase, "lantana_one.jpeg"), hotSpots: [{ pitch: -0.78, yaw: -33.2, type: "scene", text: "Go to Lantana Two", sceneId: "lantanaTwo" }] },
        lantanaTwo: { ...baseScene, title: "Lantana Two", panorama: pano(otherBase, "lantana_two.jpeg"), hotSpots: [{ pitch: 3.97, yaw: 49.7, type: "scene", text: "Back to Lantana One", sceneId: "lantanaOne" }, { pitch: 1.71, yaw: 22.96, type: "scene", text: "Go to Lantana Three", sceneId: "lantanaThree" }] },
        lantanaThree: { ...baseScene, title: "Lantana Three", panorama: pano(otherBase, "lantana_three.jpeg"), hotSpots: [{ pitch: 0.13, yaw: -43.86, type: "scene", text: "Back to Lantana Two", sceneId: "lantanaTwo" }] },
      }),
    },
  ];
}

function buildDorms() {
  const coordById = Object.fromEntries(DORM_COORDS.map((c) => [c.id, c]));
  return HOUSES.map((house) => {
    const coord = coordById[house.id];
    return {
      id: house.id,
      name: house.name,
      category: house.category,
      roomTypes: house.roomTypes,
      lat: coord?.lat ?? 37.4241,
      lng: coord?.lng ?? -122.1661,
      extraTags: DORM_EXTRA_TAGS[house.id] || [],
      communityBonus: COMMUNITY_BONUS[house.id] || 0,
      hasTour: TOUR_DORM_IDS.includes(house.id),
    };
  });
}

module.exports = {
  ROOM_LABELS,
  REASON_LABELS,
  RANKINGS_SORT_OPTIONS,
  RANKINGS_FILTERS,
  MAIN_QUAD,
  WALK_SPEED_KMH,
  DETOUR_FACTOR,
  LANDMARKS,
  QUIZ_QUESTIONS,
  buildDorms,
  buildTourConfigs,
};
