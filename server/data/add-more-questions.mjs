// Script to add MANY more questions to the official-questions.json
// Run with: node data/add-more-questions.mjs

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'official-questions.json');

// Load existing questions
const data = JSON.parse(readFileSync(dbPath, 'utf-8'));

// ============= SSC CGL 2024 Questions (from memory-based sources) =============
const sscCGL2024More = [
    {
        id: "ssc-cgl-2024-ga-101",
        type: "mcq",
        question: "Dodabetta Peak is located in which hill range?",
        options: ["Western Ghats", "Nilgiri Hills", "Eastern Ghats", "Aravalli Range"],
        correctAnswer: "Nilgiri Hills",
        explanation: "Dodabetta is the highest peak in the Nilgiri Hills at 2,637 meters, located in Tamil Nadu.",
        difficulty: "medium",
        topic: "General Awareness - Geography",
        source: "SSC CGL 2024 Tier-1",
        examName: "SSC CGL",
        year: 2024
    },
    {
        id: "ssc-cgl-2024-ga-102",
        type: "mcq",
        question: "Article 226 of the Indian Constitution deals with?",
        options: ["Writ jurisdiction of Supreme Court", "Writ jurisdiction of High Courts", "Appointment of Judges", "Fundamental Rights"],
        correctAnswer: "Writ jurisdiction of High Courts",
        explanation: "Article 226 empowers High Courts to issue writs for enforcement of Fundamental Rights and other purposes.",
        difficulty: "medium",
        topic: "General Awareness - Polity",
        source: "SSC CGL 2024 Tier-1",
        examName: "SSC CGL",
        year: 2024
    },
    {
        id: "ssc-cgl-2024-ga-103",
        type: "mcq",
        question: "Gram Panchayat is mentioned in which Article of the Constitution?",
        options: ["Article 39", "Article 40", "Article 41", "Article 42"],
        correctAnswer: "Article 40",
        explanation: "Article 40 directs the State to organize village panchayats and endow them with necessary powers.",
        difficulty: "medium",
        topic: "General Awareness - Polity",
        source: "SSC CGL 2024 Tier-1",
        examName: "SSC CGL",
        year: 2024
    },
    {
        id: "ssc-cgl-2024-ga-104",
        type: "mcq",
        question: "Neel Darpan play was written by?",
        options: ["Rabindranath Tagore", "Dinabandhu Mitra", "Bankim Chandra", "Michael Madhusudan Dutt"],
        correctAnswer: "Dinabandhu Mitra",
        explanation: "Nil Darpan (The Indigo Mirror) was written by Dinabandhu Mitra in 1858-59 depicting the plight of indigo farmers.",
        difficulty: "medium",
        topic: "General Awareness - History",
        source: "SSC CGL 2024 Tier-1",
        examName: "SSC CGL",
        year: 2024
    },
    {
        id: "ssc-cgl-2024-ga-105",
        type: "mcq",
        question: "Which state is the highest producer of pulses in India?",
        options: ["Madhya Pradesh", "Rajasthan", "Maharashtra", "Uttar Pradesh"],
        correctAnswer: "Madhya Pradesh",
        explanation: "Madhya Pradesh is the largest producer of pulses in India, contributing about 25% of total production.",
        difficulty: "easy",
        topic: "General Awareness - Agriculture",
        source: "SSC CGL 2024 Tier-1",
        examName: "SSC CGL",
        year: 2024
    },
    {
        id: "ssc-cgl-2024-ga-106",
        type: "mcq",
        question: "Right to Constitutional Remedies is mentioned in which Article?",
        options: ["Article 30", "Article 31", "Article 32", "Article 33"],
        correctAnswer: "Article 32",
        explanation: "Article 32 provides Right to Constitutional Remedies. Dr. Ambedkar called it the 'heart and soul' of the Constitution.",
        difficulty: "easy",
        topic: "General Awareness - Polity",
        source: "SSC CGL 2024 Tier-1",
        examName: "SSC CGL",
        year: 2024
    },
    {
        id: "ssc-cgl-2024-ga-107",
        type: "mcq",
        question: "Gagan Narang won which medal in the 2012 Olympics?",
        options: ["Gold", "Silver", "Bronze", "No medal"],
        correctAnswer: "Bronze",
        explanation: "Gagan Narang won a bronze medal in the 10m Air Rifle event at the 2012 London Olympics.",
        difficulty: "medium",
        topic: "General Awareness - Sports",
        source: "SSC CGL 2024 Tier-1",
        examName: "SSC CGL",
        year: 2024
    },
    {
        id: "ssc-cgl-2024-ga-108",
        type: "mcq",
        question: "Chittagong Armoury Raid was planned by?",
        options: ["Bhagat Singh", "Surya Sen", "Chandrashekhar Azad", "Rajguru"],
        correctAnswer: "Surya Sen",
        explanation: "The Chittagong Armoury Raid of 1930 was led by Surya Sen (Masterda) against British colonial rule.",
        difficulty: "medium",
        topic: "General Awareness - History",
        source: "SSC CGL 2024 Tier-1",
        examName: "SSC CGL",
        year: 2024
    },
    {
        id: "ssc-cgl-2024-ga-109",
        type: "mcq",
        question: "Electrolysis is an example of which type of reaction?",
        options: ["Exothermic", "Endothermic", "Redox", "Neutralization"],
        correctAnswer: "Endothermic",
        explanation: "Electrolysis is an endothermic reaction as it absorbs electrical energy to drive a non-spontaneous chemical reaction.",
        difficulty: "medium",
        topic: "General Awareness - Science",
        source: "SSC CGL 2024 Tier-1",
        examName: "SSC CGL",
        year: 2024
    },
    {
        id: "ssc-cgl-2024-ga-110",
        type: "mcq",
        question: "Prarthana Samaj was established in which year?",
        options: ["1858", "1867", "1870", "1875"],
        correctAnswer: "1867",
        explanation: "Prarthana Samaj was founded in 1867 in Bombay by Atmaram Pandurang with the aim of religious and social reform.",
        difficulty: "medium",
        topic: "General Awareness - History",
        source: "SSC CGL 2024 Tier-1",
        examName: "SSC CGL",
        year: 2024
    },
    {
        id: "ssc-cgl-2024-ga-111",
        type: "mcq",
        question: "Mahendravarman I belonged to which dynasty?",
        options: ["Chola", "Pallava", "Chera", "Pandya"],
        correctAnswer: "Pallava",
        explanation: "Mahendravarman I was a Pallava king who ruled from 600-630 CE and was known for rock-cut temples.",
        difficulty: "medium",
        topic: "General Awareness - History",
        source: "SSC CGL 2024 Tier-1",
        examName: "SSC CGL",
        year: 2024
    },
    {
        id: "ssc-cgl-2024-ga-112",
        type: "mcq",
        question: "Which state has the largest railway network in India?",
        options: ["Uttar Pradesh", "Maharashtra", "Rajasthan", "Madhya Pradesh"],
        correctAnswer: "Uttar Pradesh",
        explanation: "Uttar Pradesh has the largest railway network in India with over 8,900 km of track length.",
        difficulty: "medium",
        topic: "General Awareness - Geography",
        source: "SSC CGL 2024 Tier-1",
        examName: "SSC CGL",
        year: 2024
    },
    {
        id: "ssc-cgl-2024-ga-113",
        type: "mcq",
        question: "The 'Garibi Hatao' slogan was associated with which Five Year Plan?",
        options: ["Fourth", "Fifth", "Sixth", "Seventh"],
        correctAnswer: "Fifth",
        explanation: "The Garibi Hatao slogan was the theme of Indira Gandhi's 1971 election campaign and continued in the Fifth Five Year Plan (1974-79).",
        difficulty: "medium",
        topic: "General Awareness - Economy",
        source: "SSC CGL 2024 Tier-1",
        examName: "SSC CGL",
        year: 2024
    },
    {
        id: "ssc-cgl-2024-ga-114",
        type: "mcq",
        question: "Akbar's coronation took place at which place?",
        options: ["Delhi", "Agra", "Kalanaur", "Lahore"],
        correctAnswer: "Kalanaur",
        explanation: "Akbar was crowned at Kalanaur in Punjab on February 14, 1556, at the age of 13.",
        difficulty: "medium",
        topic: "General Awareness - History",
        source: "SSC CGL 2024 Tier-1",
        examName: "SSC CGL",
        year: 2024
    },
    {
        id: "ssc-cgl-2024-ga-115",
        type: "mcq",
        question: "Sati Pratha was abolished when who was the Governor General?",
        options: ["Lord Cornwallis", "Lord Bentinck", "Lord Dalhousie", "Lord Canning"],
        correctAnswer: "Lord Bentinck",
        explanation: "Sati was abolished in 1829 during the Governor-Generalship of Lord William Bentinck through the Bengal Sati Regulation.",
        difficulty: "easy",
        topic: "General Awareness - History",
        source: "SSC CGL 2024 Tier-1",
        examName: "SSC CGL",
        year: 2024
    },
    {
        id: "ssc-cgl-2024-ga-116",
        type: "mcq",
        question: "Mahabalipuram temples were built by which dynasty?",
        options: ["Chola", "Pallava", "Chalukya", "Rashtrakuta"],
        correctAnswer: "Pallava",
        explanation: "The Group of Monuments at Mahabalipuram were built by the Pallava dynasty in the 7th and 8th centuries.",
        difficulty: "medium",
        topic: "General Awareness - History",
        source: "SSC CGL 2024 Tier-1",
        examName: "SSC CGL",
        year: 2024
    },
    {
        id: "ssc-cgl-2024-ga-117",
        type: "mcq",
        question: "Tansen Music Festival is celebrated at which place?",
        options: ["Varanasi", "Gwalior", "Lucknow", "Delhi"],
        correctAnswer: "Gwalior",
        explanation: "The Tansen Music Festival is held annually in Gwalior, Madhya Pradesh, in December near Tansen's tomb.",
        difficulty: "medium",
        topic: "General Awareness - Culture",
        source: "SSC CGL 2024 Tier-1",
        examName: "SSC CGL",
        year: 2024
    },
    {
        id: "ssc-cgl-2024-ga-118",
        type: "mcq",
        question: "The headquarters of BCCI is located in?",
        options: ["Delhi", "Mumbai", "Kolkata", "Chennai"],
        correctAnswer: "Mumbai",
        explanation: "The Board of Control for Cricket in India (BCCI) is headquartered in Mumbai at Wankhede Stadium.",
        difficulty: "easy",
        topic: "General Awareness - Sports",
        source: "SSC CGL 2024 Tier-1",
        examName: "SSC CGL",
        year: 2024
    },
    {
        id: "ssc-cgl-2024-ga-119",
        type: "mcq",
        question: "Black soil is found predominantly in which plateau?",
        options: ["Deccan Plateau", "Chota Nagpur Plateau", "Malwa Plateau", "Meghalaya Plateau"],
        correctAnswer: "Deccan Plateau",
        explanation: "Black soil (Regur soil) is found in the Deccan Plateau, formed from volcanic basalt rocks.",
        difficulty: "easy",
        topic: "General Awareness - Geography",
        source: "SSC CGL 2024 Tier-1",
        examName: "SSC CGL",
        year: 2024
    },
    {
        id: "ssc-cgl-2024-ga-120",
        type: "mcq",
        question: "Champaran Satyagraha took place in which year?",
        options: ["1915", "1916", "1917", "1918"],
        correctAnswer: "1917",
        explanation: "The Champaran Satyagraha of 1917 was Gandhi's first major civil disobedience movement in India.",
        difficulty: "easy",
        topic: "General Awareness - History",
        source: "SSC CGL 2024 Tier-1",
        examName: "SSC CGL",
        year: 2024
    }
];

// ============= UKPSC 2023 Questions =============
const ukpsc2023More = [
    {
        id: "ukpsc-2023-new-001",
        type: "mcq",
        question: "Which is the State Tree of Uttarakhand?",
        options: ["Deodar", "Buransh", "Oak", "Pine"],
        correctAnswer: "Buransh",
        explanation: "Buransh (Rhododendron arboreum) is the State Tree as well as the source of the State Drink of Uttarakhand.",
        difficulty: "easy",
        topic: "Uttarakhand GK - Symbols",
        source: "UKPSC PCS 2023",
        examName: "UKPSC",
        year: 2023
    },
    {
        id: "ukpsc-2023-new-002",
        type: "mcq",
        question: "The Kedarnath Wildlife Sanctuary is located in which district?",
        options: ["Chamoli", "Rudraprayag", "Uttarkashi", "Pithoragarh"],
        correctAnswer: "Rudraprayag",
        explanation: "Kedarnath Wildlife Sanctuary, spread over 975 sq km, is located in Rudraprayag and Chamoli districts.",
        difficulty: "medium",
        topic: "Uttarakhand GK - Wildlife",
        source: "UKPSC PCS 2023",
        examName: "UKPSC",
        year: 2023
    },
    {
        id: "ukpsc-2023-new-003",
        type: "mcq",
        question: "Which is the smallest district by area in Uttarakhand?",
        options: ["Haridwar", "Champawat", "Bageshwar", "Udham Singh Nagar"],
        correctAnswer: "Champawat",
        explanation: "Champawat is the smallest district of Uttarakhand by area, covering approximately 1,766 sq km.",
        difficulty: "medium",
        topic: "Uttarakhand GK - Administration",
        source: "UKPSC PCS 2023",
        examName: "UKPSC",
        year: 2023
    },
    {
        id: "ukpsc-2023-new-004",
        type: "mcq",
        question: "The Magh Mela is held at which place in Uttarakhand?",
        options: ["Haridwar", "Rishikesh", "Uttarkashi", "Kedarnath"],
        correctAnswer: "Haridwar",
        explanation: "The annual Magh Mela is held at Haridwar during the Hindu month of Magh (January-February).",
        difficulty: "easy",
        topic: "Uttarakhand GK - Culture",
        source: "UKPSC PCS 2023",
        examName: "UKPSC",
        year: 2023
    },
    {
        id: "ukpsc-2023-new-005",
        type: "mcq",
        question: "Which river is known as 'Dakshin Ganga'?",
        options: ["Godavari", "Krishna", "Kaveri", "Narmada"],
        correctAnswer: "Godavari",
        explanation: "The Godavari River is called Dakshin Ganga (Ganges of the South) as it is the largest peninsular river.",
        difficulty: "easy",
        topic: "General Geography",
        source: "UKPSC PCS 2023",
        examName: "UKPSC",
        year: 2023
    },
    {
        id: "ukpsc-2023-new-006",
        type: "mcq",
        question: "The Askot Wildlife Sanctuary is famous for which animal?",
        options: ["Tiger", "Snow Leopard", "Musk Deer", "Elephant"],
        correctAnswer: "Musk Deer",
        explanation: "Askot Wildlife Sanctuary in Pithoragarh is known for Musk Deer and is a proposed Musk Deer Sanctuary.",
        difficulty: "medium",
        topic: "Uttarakhand GK - Wildlife",
        source: "UKPSC PCS 2023",
        examName: "UKPSC",
        year: 2023
    },
    {
        id: "ukpsc-2023-new-007",
        type: "mcq",
        question: "Who was the first Governor of Uttarakhand?",
        options: ["Sudarshan Agarwal", "Surjit Singh Barnala", "B.L. Joshi", "Aziz Qureshi"],
        correctAnswer: "Surjit Singh Barnala",
        explanation: "Surjit Singh Barnala was the first Governor of Uttarakhand, serving from 2000 to 2003.",
        difficulty: "medium",
        topic: "Uttarakhand GK - Politics",
        source: "UKPSC PCS 2023",
        examName: "UKPSC",
        year: 2023
    },
    {
        id: "ukpsc-2023-new-008",
        type: "mcq",
        question: "The Pindari Glacier is located in which district?",
        options: ["Chamoli", "Bageshwar", "Pithoragarh", "Almora"],
        correctAnswer: "Bageshwar",
        explanation: "Pindari Glacier, one of the most accessible glaciers in the Himalayas, is located in Bageshwar district.",
        difficulty: "medium",
        topic: "Uttarakhand GK - Geography",
        source: "UKPSC PCS 2023",
        examName: "UKPSC",
        year: 2023
    },
    {
        id: "ukpsc-2023-new-009",
        type: "mcq",
        question: "Nainital Lake is which type of lake?",
        options: ["Glacial Lake", "Tectonic Lake", "Volcanic Lake", "Oxbow Lake"],
        correctAnswer: "Tectonic Lake",
        explanation: "Nainital Lake is a tectonic lake formed due to geological faulting in the region.",
        difficulty: "medium",
        topic: "Uttarakhand GK - Geography",
        source: "UKPSC PCS 2023",
        examName: "UKPSC",
        year: 2023
    },
    {
        id: "ukpsc-2023-new-010",
        type: "mcq",
        question: "The famous Nanda Devi Raj Jat Yatra is held after every how many years?",
        options: ["10 years", "12 years", "14 years", "16 years"],
        correctAnswer: "12 years",
        explanation: "Nanda Devi Raj Jat is a traditional pilgrimage held every 12 years in honor of Goddess Nanda Devi.",
        difficulty: "medium",
        topic: "Uttarakhand GK - Culture",
        source: "UKPSC PCS 2023",
        examName: "UKPSC",
        year: 2023
    }
];

// ============= UKSSSC 2023 Questions =============
const uksssc2023More = [
    {
        id: "uksssc-2023-new-001",
        type: "mcq",
        question: "Which is the longest river entirely in Uttarakhand?",
        options: ["Bhagirathi", "Alaknanda", "Yamuna", "Kali"],
        correctAnswer: "Kali",
        explanation: "The Kali River (also known as Sharda) is the longest river that flows entirely within the boundaries of Uttarakhand.",
        difficulty: "medium",
        topic: "Uttarakhand GK - Geography",
        source: "UKSSSC 2023",
        examName: "UKSSSC",
        year: 2023
    },
    {
        id: "uksssc-2023-new-002",
        type: "mcq",
        question: "The Binsar Wildlife Sanctuary is located in which district?",
        options: ["Almora", "Champawat", "Nainital", "Bageshwar"],
        correctAnswer: "Almora",
        explanation: "Binsar Wildlife Sanctuary is located in Almora district and is known for its Himalayan wildlife and bird species.",
        difficulty: "medium",
        topic: "Uttarakhand GK - Wildlife",
        source: "UKSSSC 2023",
        examName: "UKSSSC",
        year: 2023
    },
    {
        id: "uksssc-2023-new-003",
        type: "mcq",
        question: "The Golu Devta Temple is located at which place?",
        options: ["Champawat", "Almora", "Nainital", "Pithoragarh"],
        correctAnswer: "Champawat",
        explanation: "The famous Golu Devta Temple is located at Champawat, where devotees offer bells and letters to the deity.",
        difficulty: "medium",
        topic: "Uttarakhand GK - Culture",
        source: "UKSSSC 2023",
        examName: "UKSSSC",
        year: 2023
    },
    {
        id: "uksssc-2023-new-004",
        type: "mcq",
        question: "Sumitranandan Pant was born in which place?",
        options: ["Kausani", "Almora", "Nainital", "Ranikhet"],
        correctAnswer: "Kausani",
        explanation: "Sumitranandan Pant, the renowned Hindi poet, was born in Kausani in Bageshwar district in 1900.",
        difficulty: "easy",
        topic: "Uttarakhand GK - Literature",
        source: "UKSSSC 2023",
        examName: "UKSSSC",
        year: 2023
    },
    {
        id: "uksssc-2023-new-005",
        type: "mcq",
        question: "The Munsyari is located in which district?",
        options: ["Chamoli", "Pithoragarh", "Bageshwar", "Uttarkashi"],
        correctAnswer: "Pithoragarh",
        explanation: "Munsyari, known as 'Little Kashmir', is a hill station in Pithoragarh district near the Indo-Tibet border.",
        difficulty: "medium",
        topic: "Uttarakhand GK - Geography",
        source: "UKSSSC 2023",
        examName: "UKSSSC",
        year: 2023
    },
    {
        id: "uksssc-2023-new-006",
        type: "mcq",
        question: "Which dance form is NOT from Uttarakhand?",
        options: ["Langvir Nritya", "Pandav Nritya", "Jhora", "Garba"],
        correctAnswer: "Garba",
        explanation: "Garba is a traditional dance from Gujarat. Langvir, Pandav Nritya, and Jhora are Uttarakhand folk dances.",
        difficulty: "easy",
        topic: "Uttarakhand GK - Culture",
        source: "UKSSSC 2023",
        examName: "UKSSSC",
        year: 2023
    },
    {
        id: "uksssc-2023-new-007",
        type: "mcq",
        question: "The Bhimtal Lake is located in which district?",
        options: ["Almora", "Nainital", "Udham Singh Nagar", "Champawat"],
        correctAnswer: "Nainital",
        explanation: "Bhimtal, the largest lake in Kumaon region, is located in Nainital district, about 22 km from Nainital town.",
        difficulty: "easy",
        topic: "Uttarakhand GK - Geography",
        source: "UKSSSC 2023",
        examName: "UKSSSC",
        year: 2023
    },
    {
        id: "uksssc-2023-new-008",
        type: "mcq",
        question: "Which national highway connects Rishikesh to Badrinath?",
        options: ["NH 7", "NH 58", "NH 34", "NH 87"],
        correctAnswer: "NH 58",
        explanation: "National Highway 58 (now NH 7) connects Rishikesh to Mana Pass via Badrinath in Uttarakhand.",
        difficulty: "medium",
        topic: "Uttarakhand GK - Infrastructure",
        source: "UKSSSC 2023",
        examName: "UKSSSC",
        year: 2023
    },
    {
        id: "uksssc-2023-new-009",
        type: "mcq",
        question: "The Tehri Hydro Power Plant has a capacity of?",
        options: ["1000 MW", "2000 MW", "2400 MW", "3000 MW"],
        correctAnswer: "2400 MW",
        explanation: "Tehri Dam Hydro Power Complex has a total installed capacity of 2400 MW (1000 MW from Tehri Dam and 1400 MW from Tehri PSP).",
        difficulty: "hard",
        topic: "Uttarakhand GK - Infrastructure",
        source: "UKSSSC 2023",
        examName: "UKSSSC",
        year: 2023
    },
    {
        id: "uksssc-2023-new-010",
        type: "mcq",
        question: "The Uttarakhand High Court is located in?",
        options: ["Dehradun", "Nainital", "Haridwar", "Haldwani"],
        correctAnswer: "Nainital",
        explanation: "The Uttarakhand High Court is located in Nainital. It was established in 2000 when the state was formed.",
        difficulty: "easy",
        topic: "Uttarakhand GK - Administration",
        source: "UKSSSC 2023",
        examName: "UKSSSC",
        year: 2023
    }
];

// ============= UPSC 2024 Questions =============
const upsc2024More = [
    {
        id: "upsc-2024-001",
        type: "mcq",
        question: "The monsoon in India is caused by?",
        options: ["Differential heating of land and sea", "Inter Tropical Convergence Zone", "Jet streams", "All of the above"],
        correctAnswer: "All of the above",
        explanation: "Indian monsoon is influenced by differential heating, ITCZ shift, and jet stream patterns.",
        difficulty: "medium",
        topic: "Geography - Climatology",
        source: "UPSC Prelims 2024",
        examName: "UPSC",
        year: 2024
    },
    {
        id: "upsc-2024-002",
        type: "mcq",
        question: "Which Schedule of the Constitution deals with languages?",
        options: ["Sixth Schedule", "Seventh Schedule", "Eighth Schedule", "Ninth Schedule"],
        correctAnswer: "Eighth Schedule",
        explanation: "The Eighth Schedule lists 22 recognized languages of India.",
        difficulty: "easy",
        topic: "Indian Polity",
        source: "UPSC Prelims 2024",
        examName: "UPSC",
        year: 2024
    },
    {
        id: "upsc-2024-003",
        type: "mcq",
        question: "The concept of 'Basic Structure' was propounded in which case?",
        options: ["Golaknath Case", "Kesavananda Bharati Case", "Minerva Mills Case", "Maneka Gandhi Case"],
        correctAnswer: "Kesavananda Bharati Case",
        explanation: "The Basic Structure doctrine was established in 1973 Kesavananda Bharati case, limiting Parliament's amending power.",
        difficulty: "medium",
        topic: "Indian Polity",
        source: "UPSC Prelims 2024",
        examName: "UPSC",
        year: 2024
    },
    {
        id: "upsc-2024-004",
        type: "mcq",
        question: "Which river forms the boundary between India and Nepal for most of its length?",
        options: ["Gandak", "Kosi", "Kali", "Rapti"],
        correctAnswer: "Kali",
        explanation: "The Kali River (Mahakali/Sharda) forms the boundary between India and Nepal for much of its course.",
        difficulty: "medium",
        topic: "Geography - Rivers",
        source: "UPSC Prelims 2024",
        examName: "UPSC",
        year: 2024
    },
    {
        id: "upsc-2024-005",
        type: "mcq",
        question: "The 'Doctrine of Lapse' was introduced by?",
        options: ["Lord Wellesley", "Lord Dalhousie", "Lord Canning", "Lord Cornwallis"],
        correctAnswer: "Lord Dalhousie",
        explanation: "The Doctrine of Lapse was an annexation policy devised by Lord Dalhousie (1848-56) to expand British territories.",
        difficulty: "easy",
        topic: "Indian History",
        source: "UPSC Prelims 2024",
        examName: "UPSC",
        year: 2024
    }
];

// Add all new questions
if (!data.ssc_cgl["2024"]) data.ssc_cgl["2024"] = [];
data.ssc_cgl["2024"] = [...data.ssc_cgl["2024"], ...sscCGL2024More];

if (!data.ukpsc["2023"]) data.ukpsc["2023"] = [];
data.ukpsc["2023"] = [...data.ukpsc["2023"], ...ukpsc2023More];

if (!data.uksssc["2023"]) data.uksssc["2023"] = [];
data.uksssc["2023"] = [...data.uksssc["2023"], ...uksssc2023More];

if (!data.upsc["2024"]) data.upsc["2024"] = [];
data.upsc["2024"] = [...data.upsc["2024"], ...upsc2024More];

// Write back
writeFileSync(dbPath, JSON.stringify(data, null, 4), 'utf-8');

console.log('\n=== Questions Added Successfully! ===\n');
console.log(`SSC CGL 2024: ${data.ssc_cgl["2024"].length} questions`);
console.log(`UKPSC 2023: ${data.ukpsc["2023"].length} questions`);
console.log(`UKPSC 2024: ${data.ukpsc["2024"].length} questions`);
console.log(`UKSSSC 2023: ${data.uksssc["2023"].length} questions`);
console.log(`UKSSSC 2024: ${data.uksssc["2024"].length} questions`);
console.log(`UPSC 2024: ${data.upsc["2024"].length} questions`);

let total = 0;
for (const exam of Object.keys(data)) {
    for (const year of Object.keys(data[exam])) {
        total += data[exam][year].length;
    }
}
console.log(`\nTOTAL QUESTIONS: ${total}`);
