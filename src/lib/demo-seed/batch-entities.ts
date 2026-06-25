// Curated batch demo community/event specs for the admin demo seeding tools.
import { CommunityType, EventCategory } from "@/lib/prisma";

export interface BatchCommunitySpec {
  name: string;
  description: string;
  type: CommunityType;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  foundingYear: number;
  seekingVolunteers: boolean;
  vision: string;
}

export interface BatchEventSpec {
  title: string;
  description: string;
  category: EventCategory;
  location: string;
  latitude: number;
  longitude: number;
  daysFromNow: number;
  durationHours: number;
  costType: "FREE" | "DONATION" | "PAID";
  capacity: number;
  isOnline: boolean;
}

export const BATCH_DEMO_COMMUNITIES: BatchCommunitySpec[] = [
  {
    name: "Buenos Aires Regenerative Hub",
    description:
      "A collaborative network of urban farmers, educators, and social innovators in the heart of Buenos Aires, working to transform vacant lots into productive community gardens and regenerative learning spaces.",
    type: CommunityType.EARTH_REGENERATION_CENTER,
    city: "Buenos Aires",
    country: "Argentina",
    latitude: -34.6118,
    longitude: -58.396,
    foundingYear: 2019,
    seekingVolunteers: true,
    vision:
      "A fully regenerative metropolitan area where every neighbourhood has its own food forest and circular economy node.",
  },
  {
    name: "Lagos Creative Commons",
    description:
      "A pan-African makers collective bridging traditional craftsmanship and cutting-edge technology to create economic opportunity and cultural pride across West Africa.",
    type: CommunityType.CREATIVE_ARTS_COLONY,
    city: "Lagos",
    country: "Nigeria",
    latitude: 6.5244,
    longitude: 3.3792,
    foundingYear: 2021,
    seekingVolunteers: true,
    vision:
      "Empowering African creators to lead the global circular economy through innovation rooted in indigenous knowledge.",
  },
  {
    name: "Mumbai Healing Collective",
    description:
      "An integrative wellness community offering mental health support, somatic healing, and trauma-informed care in one of the world's most densely populated cities.",
    type: CommunityType.HEALING_SANCTUARY,
    city: "Mumbai",
    country: "India",
    latitude: 19.076,
    longitude: 72.8777,
    foundingYear: 2020,
    seekingVolunteers: false,
    vision:
      "Accessible mental and physical wellbeing for every resident of Mumbai, regardless of income.",
  },
  {
    name: "Seoul Knowledge Commons",
    description:
      "An open-access learning community run by educators, technologists, and activists committed to digital rights, civic technology, and lifelong learning in East Asia.",
    type: CommunityType.KNOWLEDGE_HUB,
    city: "Seoul",
    country: "South Korea",
    latitude: 37.5665,
    longitude: 126.978,
    foundingYear: 2018,
    seekingVolunteers: true,
    vision:
      "A world where knowledge flows freely and technology serves humanity rather than exploiting it.",
  },
  {
    name: "Berlin Egalitarian Living Collective",
    description:
      "A pioneering co-living community in Neukölln practising radical resource sharing, consensus decision-making, and economic solidarity among 80+ residents from 30 countries.",
    type: CommunityType.EGALITARIAN_LIVING,
    city: "Berlin",
    country: "Germany",
    latitude: 52.4853,
    longitude: 13.4291,
    foundingYear: 2015,
    seekingVolunteers: false,
    vision:
      "Demonstrating that people can live abundantly with less through genuine cooperation.",
  },
  {
    name: "Nairobi Frontline Network",
    description:
      "A grassroots activist coalition defending land rights, water access, and climate justice for communities on the frontlines of environmental destruction in East Africa.",
    type: CommunityType.FRONTLINE_ACTIVIST,
    city: "Nairobi",
    country: "Kenya",
    latitude: -1.2921,
    longitude: 36.8219,
    foundingYear: 2017,
    seekingVolunteers: true,
    vision:
      "An Africa where indigenous communities control their own land, water, and futures.",
  },
  {
    name: "Vancouver Nomadic Network",
    description:
      "A mobile community of remote workers, digital nomads, and seasonal workers co-creating shared infrastructure, skill-sharing circles, and mutual aid across the Pacific Northwest.",
    type: CommunityType.NOMADIC_NETWORK,
    city: "Vancouver",
    country: "Canada",
    latitude: 49.2827,
    longitude: -123.1207,
    foundingYear: 2022,
    seekingVolunteers: true,
    vision:
      "Portable community resilience that travels with the people who need it.",
  },
  {
    name: "Auckland Spiritual Haven",
    description:
      "A multi-tradition contemplative community blending Māori tikanga, Buddhist mindfulness, and contemporary spirituality to support personal transformation and collective healing in Aotearoa.",
    type: CommunityType.SPIRITUAL_HAVEN,
    city: "Auckland",
    country: "New Zealand",
    latitude: -36.8509,
    longitude: 174.7645,
    foundingYear: 2016,
    seekingVolunteers: false,
    vision:
      "A culture of deep listening, inner peace, and reverence for all life forms.",
  },
  {
    name: "São Paulo Regenerative Cooperative",
    description:
      "A solidarity economy network of 200+ small producers, artisans, and service workers building an alternative economic ecosystem based on fair trade, ecological standards, and community ownership.",
    type: CommunityType.REGENERATIVE_ECONOMIC,
    city: "São Paulo",
    country: "Brazil",
    latitude: -23.5505,
    longitude: -46.6333,
    foundingYear: 2020,
    seekingVolunteers: false,
    vision:
      "A Brazilian economy rooted in solidarity, ecological balance, and genuine equity.",
  },
  {
    name: "Bangkok Inclusive Support Network",
    description:
      "A community-led support system for migrants, refugees, LGBTQ+ individuals, and people with disabilities in Southeast Asia's largest metropolis, offering legal aid, housing, and social connection.",
    type: CommunityType.INCLUSIVE_SUPPORT_NETWORK,
    city: "Bangkok",
    country: "Thailand",
    latitude: 13.7563,
    longitude: 100.5018,
    foundingYear: 2019,
    seekingVolunteers: true,
    vision:
      "Bangkok where everyone — regardless of origin or identity — can thrive and belong.",
  },
];

export const BATCH_DEMO_EVENTS: BatchEventSpec[] = [
  {
    title: "Global Regenerative Agriculture Summit",
    description:
      "A three-day gathering of farmers, soil scientists, and food activists from 40 countries sharing the latest in regenerative land management, agroforestry, and food sovereignty. Includes field visits, workshops, and open space sessions.",
    category: EventCategory.OTHER,
    location: "Buenos Aires, Argentina",
    latitude: -34.6037,
    longitude: -58.3816,
    daysFromNow: 14,
    durationHours: 72,
    costType: "DONATION",
    capacity: 300,
    isOnline: false,
  },
  {
    title: "African Makers & Circular Economy Expo",
    description:
      "A marketplace and knowledge fair celebrating African innovation in upcycling, biomaterials, and circular product design. Over 80 exhibitors from across the continent showcase products, tools, and methodologies.",
    category: EventCategory.OPEN_DAY,
    location: "Lagos, Nigeria",
    latitude: 6.4281,
    longitude: 3.4219,
    daysFromNow: 21,
    durationHours: 48,
    costType: "FREE",
    capacity: 500,
    isOnline: false,
  },
  {
    title: "Somatic Healing & Trauma Release Workshop",
    description:
      "An immersive weekend workshop combining breathwork, movement, and trauma-informed somatic therapy. Designed for changemakers and activists carrying the weight of the world. Bilingual (Hindi/English).",
    category: EventCategory.WORKSHOP,
    location: "Mumbai, India",
    latitude: 19.076,
    longitude: 72.8777,
    daysFromNow: 10,
    durationHours: 16,
    costType: "DONATION",
    capacity: 40,
    isOnline: false,
  },
  {
    title: "Digital Rights & Civic Tech Hackathon",
    description:
      "A 48-hour hackathon for developers, designers, and activists building open-source tools for digital rights protection, algorithmic accountability, and civic participation. Cash prizes and mentorship for top teams.",
    category: EventCategory.OTHER,
    location: "Seoul, South Korea",
    latitude: 37.5665,
    longitude: 126.978,
    daysFromNow: 30,
    durationHours: 48,
    costType: "FREE",
    capacity: 150,
    isOnline: false,
  },
  {
    title: "Radical Sharing: Co-Living Open Doors Weekend",
    description:
      "Open your imagination to radically different ways of living. Visit Berlin's most innovative co-living communities, attend panel discussions on commons governance, and meet people living the alternative.",
    category: EventCategory.OPEN_DAY,
    location: "Berlin, Germany",
    latitude: 52.52,
    longitude: 13.405,
    daysFromNow: 18,
    durationHours: 24,
    costType: "FREE",
    capacity: 200,
    isOnline: false,
  },
  {
    title: "Land Rights & Climate Justice Gathering",
    description:
      "A convergence of frontline communities, legal advocates, and climate scientists to document land grabs, strategise legal challenges, and build a continental network for environmental defenders.",
    category: EventCategory.OPEN_SPACE,
    location: "Nairobi, Kenya",
    latitude: -1.2921,
    longitude: 36.8219,
    daysFromNow: 25,
    durationHours: 36,
    costType: "FREE",
    capacity: 120,
    isOnline: false,
  },
  {
    title: "Digital Nomad Skills Swap & Meetup",
    description:
      "A monthly skill-sharing and networking event for remote workers, freelancers, and nomads. Each session features 3-minute skill demos, open coworking, and a communal meal. All experience levels welcome.",
    category: EventCategory.MEETUP,
    location: "Vancouver, Canada",
    latitude: 49.2827,
    longitude: -123.1207,
    daysFromNow: 7,
    durationHours: 4,
    costType: "FREE",
    capacity: 60,
    isOnline: false,
  },
  {
    title: "Māori Wisdom & Contemplative Practice Retreat",
    description:
      "A four-day silent retreat honouring Māori traditions alongside Buddhist and embodiment practices. Held on a whenua (land) with direct blessings from local kaumātua (elders). Limited to 25 participants.",
    category: EventCategory.RETREAT,
    location: "Auckland, New Zealand",
    latitude: -36.8509,
    longitude: 174.7645,
    daysFromNow: 45,
    durationHours: 96,
    costType: "DONATION",
    capacity: 25,
    isOnline: false,
  },
  {
    title: "Solidarity Economy Fair — Feira Solidária",
    description:
      "Annual festival of the solidarity economy featuring 150 cooperatives, collectives, and fair-trade producers. Live music, workshops on economic democracy, and a giant collective meal. Families welcome.",
    category: EventCategory.CELEBRATION,
    location: "São Paulo, Brazil",
    latitude: -23.5505,
    longitude: -46.6333,
    daysFromNow: 35,
    durationHours: 10,
    costType: "FREE",
    capacity: 1000,
    isOnline: false,
  },
  {
    title: "Mutual Aid & Community Care Workday",
    description:
      "A hands-on day of community service: repairing homes for elderly residents, distributing fresh food to migrants, and connecting isolated individuals with support networks. Orientation provided. Tools supplied.",
    category: EventCategory.WORKDAY,
    location: "Bangkok, Thailand",
    latitude: 13.7563,
    longitude: 100.5018,
    daysFromNow: 12,
    durationHours: 8,
    costType: "FREE",
    capacity: 80,
    isOnline: false,
  },
];
