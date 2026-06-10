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
  { key: "rating", label: "Resident rating" },
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

// Every dorm has a tour. Seven have multi-scene tours from real photos of
// that dorm; the rest get a single-scene tour from the distributed photo pool.
const TOUR_DORM_IDS = HOUSES.map((h) => h.id);

// Single-scene panoramas for dorms without dedicated multi-photo tours.
// Only the 8 approved room images are used here — dorms without their own
// photo share one of the 8 (each image covers 2-3 dorms).
const SINGLE_SCENE_PANOS = {
  branner: "branner_one.jpeg",
  crothers: "crothers_one.jpeg",
  alondra: "alondra_one.jpeg",
  castano: "castano_one.jpeg",
  robinson: "robinson_one.jpeg",
  donner: "donner_one.jpeg",
  ujamaa: "ujamaa_one.jpeg",
  "west-lagunita": "westlagunita_one.jpeg",
  mirlo: "branner_one.jpeg",
  larkin: "crothers_one.jpeg",
  arroyo: "alondra_one.jpeg",
  cedro: "castano_one.jpeg",
  cardenal: "robinson_one.jpeg",
  potter: "donner_one.jpeg",
  burbank: "ujamaa_one.jpeg",
  "casa-zapata": "westlagunita_one.jpeg",
  junipero: "branner_one.jpeg",
  otero: "crothers_one.jpeg",
};

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

  const nameById = Object.fromEntries(HOUSES.map((h) => [h.id, h.name]));
  const singleSceneTours = Object.entries(SINGLE_SCENE_PANOS).map(([dormId, file]) => {
    const sceneId = dormId.replace(/-/g, "") + "One";
    return {
      dormId,
      config: withDefaults(sceneId, {
        [sceneId]: {
          ...baseScene,
          title: nameById[dormId] + " Room",
          panorama: pano(otherBase, file),
          hotSpots: [],
        },
      }),
    };
  });

  return singleSceneTours.concat([
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
    {
      dormId: "schiff",
      config: withDefaults("schiffOne", {
        schiffOne: { ...baseScene, title: "Schiff One", panorama: pano(otherBase, "schiff_one.jpeg"), hotSpots: [{ pitch: 0.38, yaw: -19.1, type: "scene", text: "Go to Schiff Two", sceneId: "schiffTwo" }] },
        schiffTwo: { ...baseScene, title: "Schiff Two", panorama: pano(otherBase, "schiff_two.jpeg"), hotSpots: [{ pitch: 1.46, yaw: -16.48, type: "scene", text: "Back to Schiff One", sceneId: "schiffOne" }, { pitch: 1.3, yaw: 3.07, type: "scene", text: "Go to Schiff Three", sceneId: "schiffThree" }] },
        schiffThree: { ...baseScene, title: "Schiff Three", panorama: pano(otherBase, "schiff_three.jpeg"), hotSpots: [{ pitch: 0.44, yaw: -6.65, type: "scene", text: "Back to Schiff Two", sceneId: "schiffTwo" }, { pitch: -7.67, yaw: -53.29, type: "scene", text: "Go to Schiff Four", sceneId: "schiffFour" }] },
        schiffFour: { ...baseScene, title: "Schiff Four", panorama: pano(otherBase, "schiff_four.jpeg"), hotSpots: [{ pitch: -0.14, yaw: -37.48, type: "scene", text: "Back to Schiff Three", sceneId: "schiffThree" }] },
      }),
    },
  ]);
}

// Curated resident-feedback quotes gathered from Reddit, Roomsurf, RateMyDorm,
// the Stanford Daily, and Stanford R&DE/ResEd. These seed each dorm with some
// real-world signal; users add their own reviews on top via the public form.
// `author` = who said it / source attribution, `source` = scope / caveat.
const CURATED_REVIEWS = [
  // --- First-year designated dorms ---
  {
    dormId: "branner",
    body: "Best freshman dorm for sure. Rooms are fairly narrow with just enough room for 3 beds and 3 desks.",
    author: "Reddit users groovyepidermis and ExaminationFancy",
    source: "Direct Branner thread",
  },
  {
    dormId: "branner",
    body: "The rooms are more spacious than the floor plans indicate. Branner is historic but not in an old broken down way. You get your own sink.",
    author: "Reddit users fleetwoodmuck and TinderForMidgets",
    source: "Direct Branner thread",
  },
  {
    dormId: "crothers",
    body: "The dorms are big, clean and overall feel safe! It was nice, and fairly quiet.",
    author: "Roomsurf reviewers Jaden G. and Jack C.",
    source: "Direct Crothers reviews",
  },
  {
    dormId: "crothers",
    body: "The RFs are stellar. Community is severely lacking.",
    author: "Unnamed RateMyDorm reviewer",
    source: "Direct Crothers review; mixed",
  },
  {
    dormId: "crothers",
    body: "Crothers as a freshman is not bad at all. Location is god tier. It's an older building, you definitely see the wear and tear.",
    author: "Reddit users new_user_23, Traditional-Horse-78, and podgoricka",
    source: "Direct Crothers Reddit comments",
  },
  {
    dormId: "alondra",
    body: "It has a great atmosphere and it's super fun. I made lots of friends here.",
    author: "Roomsurf reviewer Tuan T. on Florence Moore Hall",
    source: "FloMo-level proxy, not Alondra-specific",
  },
  {
    dormId: "alondra",
    body: "Known for being one of the quieter dorms. I never met anyone from Mirlo, Paloma, Alondra.",
    author: "Stanford Review on FloMo; Reddit user ExaminationFancy on FloMo mixing",
    source: "FloMo/Alondra proxy",
  },
  {
    dormId: "mirlo",
    body: "It's on the quieter end later each quarter. Laundry, dining, and bathrooms are fine.",
    author: "Reddit user StackOwOFlow",
    source: "Direct Mirlo/FloMo thread",
  },
  {
    dormId: "mirlo",
    body: "Mirlo is in west flo. You'll have a great time!!",
    author: "Reddit user hwalt1",
    source: "Direct Mirlo/FloMo thread",
  },
  {
    dormId: "castano",
    body: "My friends in castaño last year loved it. The dorm itself is quite nice. Wonderful facilities.",
    author: "Reddit users SimbaActorBoy, siegeofravens, and an anonymous/deleted RA commenter",
    source: "Direct Castaño/Casper comments",
  },
  {
    dormId: "castano",
    body: "This is the best dorm! It is so central to everything on campus.",
    author: "Roomsurf reviewer Chloe R. on Gerhard Casper Quad",
    source: "Casper Quad-level proxy",
  },
  {
    dormId: "lantana",
    body: "I loved the energy, the quiet. I didn't like the showers.",
    author: "Roomsurf reviewer Corazon J.",
    source: "Direct Lantana review",
  },
  {
    dormId: "lantana",
    body: "It was new and felt really nice. Lantana was a really great freshman dorm!",
    author: "Reddit users dodoohead98 and Appropriate_Bet_347",
    source: "Direct/near-direct Reddit comments",
  },
  {
    dormId: "robinson",
    body: "People just like to have fun here. Everyone can have fun while still respecting other people's boundaries.",
    author: "Ishaan Singh '24, Robinson RA, quoted by Stanford Daily",
    source: "Direct Robinson/GovCo quote",
  },
  {
    dormId: "robinson",
    body: "The community here has been so wonderful. I just lived in Robinson last year and it was the best.",
    author: "Roya Ahmadi '25, Robinson resident (Stanford Daily); Reddit user Ahihidongoc1",
    source: "Direct Robinson/GovCo",
  },
  {
    dormId: "schiff",
    body: "The people here are amazing. People are realizing that GovCo is the place to be.",
    author: "Amy Chang '25 and Ishaan Singh '24, quoted by Stanford Daily",
    source: "GovCo/Sterling Quad proxy; no strong Schiff-only review found",
  },
  {
    dormId: "schiff",
    body: "Schiff dorm in GovCo is nicknamed 'Schiff, Inc.'",
    author: "Stanford Daily caption by Aliana Arzola",
    source: "Schiff-specific but about dorm theme, not quality",
  },
  {
    dormId: "west-lagunita",
    body: "Lagunita is one of my favorite places on campus. The proximity to the gym, lake lag, and engineering quad is excellent.",
    author: "Roomsurf reviewer Ciara L.",
    source: "Lagunita Court-level review",
  },
  {
    dormId: "west-lagunita",
    body: "Lag is a great dorm! Sweet location and a beautiful complex. Rooms in Lag are small.",
    author: "Reddit user ExaminationFancy (two threads)",
    source: "West Lag/Lagunita comments",
  },
  {
    dormId: "donner",
    body: "Amazing location on campus. Downside: Laundry.",
    author: "Unnamed RateMyDorm reviewer",
    source: "Direct Donner review",
  },
  {
    dormId: "donner",
    body: "It was a great experience. It was very sociable. It's the people that make the experience.",
    author: "Reddit users PacificCoral and KrACkEn24",
    source: "Direct Donner thread",
  },
  {
    dormId: "larkin",
    body: "The incredible location. Everyone was so kind and welcoming.",
    author: "Roomsurf reviewer Benita K.",
    source: "Direct Larkin review",
  },
  {
    dormId: "larkin",
    body: "Community created for freshmen by the staff. I had a great time. Easy access to everything.",
    author: "Roomsurf reviewer Valeria G.; Reddit user rjpizz",
    source: "Direct Larkin reviews/comments",
  },
  {
    dormId: "arroyo",
    body: "Arrrroyo. Wilbur Hall is amazing for its neighborhood-like feel.",
    author: "Stanford Daily on Arroyo's theme; Roomsurf reviewer Aja J. on Wilbur",
    source: "Arroyo-specific theme quote plus Wilbur proxy",
  },
  {
    dormId: "cedro",
    body: "Cedro is 'Cedrio Kart'. It is mid.",
    author: "Stanford Daily; Cedro resident Sebastian Vasquez '26",
    source: "Direct Cedro theme quote, not room-quality review",
  },
  {
    dormId: "cedro",
    body: "Not the cleanest dorm on campus, but a cozy space.",
    author: "Roomsurf reviewer Almog A. on Wilbur",
    source: "Wilbur-level proxy",
  },
  {
    dormId: "rinconada",
    body: "Rinconada's theme, 'Rinckini Bottom', is a clever one.",
    author: "Stanford Daily",
    source: "Rinconada-specific theme quote",
  },
  {
    dormId: "rinconada",
    body: "The people inside the building were pretty nice. The showers could have been better.",
    author: "Roomsurf Verified Resident on Wilbur",
    source: "Wilbur-level proxy",
  },
  {
    dormId: "soto",
    body: "The dorm is older. The location is great. All dorms have their pros and cons.",
    author: "Verified Student, RateMyDorm",
    source: "Direct Soto review",
  },
  {
    dormId: "soto",
    body: "Lived in Soto in Wilbur, loved that one as well. Sotoulmates.",
    author: "Reddit user dodoohead98; Stanford Daily on theme",
    source: "Direct Soto comment plus theme quote",
  },
  // --- Four-class undergraduate dorms ---
  {
    dormId: "cardenal",
    body: "Rooms are all one-room doubles. Killer view of Hoover Tower.",
    author: "Reddit user ExaminationFancy",
    source: "Direct Cardenal thread",
  },
  {
    dormId: "cardenal",
    body: "Each dorm within FloMo was independent and didn't really mix.",
    author: "Reddit user ExaminationFancy",
    source: "Older anecdote; may vary by year",
  },
  {
    dormId: "potter",
    body: "Potter is nice. Potter was honestly super quiet but a lovely dorm.",
    author: "Reddit users beaver927 and Efficient-Lemon-403",
    source: "Direct Potter thread",
  },
  {
    dormId: "potter",
    body: "The halls were always barely lit. The rooms were awkwardly sized. 2/10.",
    author: "Unnamed RateMyDorm reviewer who said they lived in Potter",
    source: "Direct Potter review; very negative",
  },
  {
    dormId: "ujamaa",
    body: "Everyone that I've met who has lived in Uj has loved it. Lots of unity and a true dorm identity.",
    author: "Reddit user ExaminationFancy",
    source: "Direct Ujamaa thread",
  },
  {
    dormId: "ujamaa",
    body: "Ujamaa was pretty dope — a really dope community and an amazing experience.",
    author: "Reddit user DenimmineD",
    source: "Older direct Ujamaa experience; also included mixed caveats",
  },
  {
    dormId: "burbank",
    body: "Super friendly students and I love the environment, especially the program that I am in (ITALIC).",
    author: "Roomsurf Verified Resident on Stern/ITALIC",
    source: "Stern/ITALIC proxy; Burbank is ITALIC",
  },
  {
    dormId: "burbank",
    body: "Burbank is home to the ITALIC theme house.",
    author: "Stanford R&DE",
    source: "Official description, not a student review",
  },
  {
    dormId: "zap",
    body: "It's nice, but the location is a bit meh. Not super social. Parking is great.",
    author: "Reddit user The_crew",
    source: "Direct ZAP row-house comment",
  },
  {
    dormId: "zap",
    body: "0 reviews. Houses members of ZAP.",
    author: "myDORM page for ZAP House",
    source: "Shows lack of review data on myDORM",
  },
  {
    dormId: "casa-zapata",
    body: "It's a nice space! The rooms aren't massive. Middle of the pack.",
    author: "Reddit user fleetwoodmuck",
    source: "Direct Casa Zapata thread",
  },
  {
    dormId: "casa-zapata",
    body: "Casa Zapata dons the name 'Into the Zapataverse'.",
    author: "Stanford Daily",
    source: "Theme quote, not room-quality review",
  },
  {
    dormId: "sally-ride",
    body: "Form strong bonds of friendship in an open and safe community.",
    author: "Stanford Residential Education",
    source: "Official Stanford description, not an independent student review",
  },
  {
    dormId: "sally-ride",
    body: "Super friendly students and I love the environment!",
    author: "Roomsurf Verified Resident on Stern Hall",
    source: "Stern-level proxy; no direct Sally Ride review found",
  },
  {
    dormId: "junipero",
    body: "It's very well located — the classic frosh experience.",
    author: "Reddit user hwalt1",
    source: "Direct Junipero thread",
  },
  {
    dormId: "junipero",
    body: "Rooms are all 1-room doubles, so space is limited.",
    author: "Reddit user ExaminationFancy",
    source: "Direct Junipero thread",
  },
  {
    dormId: "okada",
    body: "Pretty tight-knit community, Asian-American themed. Hit-or-miss for community.",
    author: "Reddit user IFailedUgh and an anonymous/deleted Reddit commenter",
    source: "Direct Okada thread; mixed",
  },
  {
    dormId: "okada",
    body: "They do a lot to try to celebrate your Asian heritage. Really loved and treasured it.",
    author: "Reddit user Ninonysoft",
    source: "Direct Okada experience",
  },
  {
    dormId: "otero",
    body: "The dorms were nice, the common space was great, friendly and open.",
    author: "Reddit user Far_Hearing_9728, who stayed there for admit weekend",
    source: "Direct Otero thread, but not a full-year resident",
  },
  {
    dormId: "otero",
    body: "Otero was the most problematic dorm.",
    author: "Reddit user Valuable_Weather3547",
    source: "Anonymous, serious negative claim; treat as unverified",
  },
];

function buildReviews() {
  return CURATED_REVIEWS.map((r) => ({ ...r, curated: true, anonymous: false }));
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
  buildReviews,
};
