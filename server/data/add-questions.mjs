// Script to add more questions to the official-questions.json
// Run with: node add-questions.mjs

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'official-questions.json');

// Load existing questions
const data = JSON.parse(readFileSync(dbPath, 'utf-8'));

// New UKPSC 2024 Questions to add
const newUKPSC2024 = [
    {
        id: "ukpsc-2024-new-001",
        type: "mcq",
        question: "Who was the first Chief Minister of Uttarakhand?",
        options: ["Nityanand Swami", "Narayan Dutt Tiwari", "BC Khanduri", "Ramesh Pokhriyal"],
        correctAnswer: "Nityanand Swami",
        explanation: "Nityanand Swami served as the first Chief Minister of Uttarakhand from November 2000 to October 2001.",
        difficulty: "easy",
        topic: "Uttarakhand GK - Politics",
        source: "UKPSC PCS 2024",
        examName: "UKPSC",
        year: 2024
    },
    {
        id: "ukpsc-2024-new-002",
        type: "mcq",
        question: "The Jim Corbett National Park is located in which district?",
        options: ["Nainital", "Almora", "Udham Singh Nagar", "Pauri Garhwal"],
        correctAnswer: "Nainital",
        explanation: "Jim Corbett National Park is mainly in Nainital district, with some parts in Pauri Garhwal. It was established in 1936 as Hailey National Park.",
        difficulty: "easy",
        topic: "Uttarakhand GK - Geography",
        source: "UKPSC PCS 2024",
        examName: "UKPSC",
        year: 2024
    },
    {
        id: "ukpsc-2024-new-003",
        type: "mcq",
        question: "Which lake in Uttarakhand is known as the 'Lake of Mystery'?",
        options: ["Roopkund", "Nainital", "Bhimtal", "Sattal"],
        correctAnswer: "Roopkund",
        explanation: "Roopkund Lake in Chamoli district is known as the 'Skeleton Lake' or 'Mystery Lake' due to human skeletal remains found there.",
        difficulty: "medium",
        topic: "Uttarakhand GK - Geography",
        source: "UKPSC PCS 2024",
        examName: "UKPSC",
        year: 2024
    },
    {
        id: "ukpsc-2024-new-004",
        type: "mcq",
        question: "The Tehri Dam is built on which river?",
        options: ["Alaknanda", "Bhagirathi", "Yamuna", "Mandakini"],
        correctAnswer: "Bhagirathi",
        explanation: "Tehri Dam is built on the Bhagirathi River near Tehri in Uttarakhand. It is one of the highest dams in the world.",
        difficulty: "easy",
        topic: "Uttarakhand GK - Infrastructure",
        source: "UKPSC PCS 2024",
        examName: "UKPSC",
        year: 2024
    },
    {
        id: "ukpsc-2024-new-005",
        type: "mcq",
        question: "Which is the State Animal of Uttarakhand?",
        options: ["Snow Leopard", "Musk Deer", "Himalayan Black Bear", "Barking Deer"],
        correctAnswer: "Musk Deer",
        explanation: "The Musk Deer (Kasturi Mrig) is the State Animal of Uttarakhand. It is found in the Alpine forests of the Himalayas.",
        difficulty: "easy",
        topic: "Uttarakhand GK - Symbols",
        source: "UKPSC PCS 2024",
        examName: "UKPSC",
        year: 2024
    },
    {
        id: "ukpsc-2024-new-006",
        type: "mcq",
        question: "Which bird is the State Bird of Uttarakhand?",
        options: ["Indian Peacock", "Himalayan Monal", "Black Partridge", "Snow Pigeon"],
        correctAnswer: "Himalayan Monal",
        explanation: "The Himalayan Monal (Danphe) is the State Bird of Uttarakhand. It is known for its colorful plumage.",
        difficulty: "easy",
        topic: "Uttarakhand GK - Symbols",
        source: "UKPSC PCS 2024",
        examName: "UKPSC",
        year: 2024
    },
    {
        id: "ukpsc-2024-new-007",
        type: "mcq",
        question: "The Chipko Movement started in which year?",
        options: ["1970", "1973", "1975", "1980"],
        correctAnswer: "1973",
        explanation: "The Chipko Movement started in 1973 in Chamoli district of Uttarakhand. Sunderlal Bahuguna was a prominent leader of this movement.",
        difficulty: "medium",
        topic: "Uttarakhand GK - History",
        source: "UKPSC PCS 2024",
        examName: "UKPSC",
        year: 2024
    },
    {
        id: "ukpsc-2024-new-008",
        type: "mcq",
        question: "Which pass connects India with Tibet through Uttarakhand?",
        options: ["Nathu La", "Lipulekh Pass", "Rohtang Pass", "Shipki La"],
        correctAnswer: "Lipulekh Pass",
        explanation: "Lipulekh Pass in Pithoragarh district connects India with Tibet. It is also a route for Kailash Mansarovar pilgrimage.",
        difficulty: "medium",
        topic: "Uttarakhand GK - Geography",
        source: "UKPSC PCS 2024",
        examName: "UKPSC",
        year: 2024
    },
    {
        id: "ukpsc-2024-new-009",
        type: "mcq",
        question: "The famous Laxman Jhula is located in which city?",
        options: ["Haridwar", "Rishikesh", "Dehradun", "Nainital"],
        correctAnswer: "Rishikesh",
        explanation: "Laxman Jhula is an iconic suspension bridge over the Ganga River in Rishikesh. It is named after Lord Laxman.",
        difficulty: "easy",
        topic: "Uttarakhand GK - Culture",
        source: "UKPSC PCS 2024",
        examName: "UKPSC",
        year: 2024
    },
    {
        id: "ukpsc-2024-new-010",
        type: "mcq",
        question: "Which is the largest district by area in Uttarakhand?",
        options: ["Chamoli", "Uttarkashi", "Pithoragarh", "Pauri Garhwal"],
        correctAnswer: "Chamoli",
        explanation: "Chamoli is the largest district in Uttarakhand by area, covering approximately 8,030 sq km.",
        difficulty: "medium",
        topic: "Uttarakhand GK - Administration",
        source: "UKPSC PCS 2024",
        examName: "UKPSC",
        year: 2024
    },
    {
        id: "ukpsc-2024-new-011",
        type: "mcq",
        question: "The Rajaji National Park is famous for which animal?",
        options: ["Tiger", "Elephant", "Rhino", "Lion"],
        correctAnswer: "Elephant",
        explanation: "Rajaji National Park, spread across Haridwar, Dehradun, and Pauri Garhwal districts, is famous for its elephant population.",
        difficulty: "easy",
        topic: "Uttarakhand GK - Wildlife",
        source: "UKPSC PCS 2024",
        examName: "UKPSC",
        year: 2024
    },
    {
        id: "ukpsc-2024-new-012",
        type: "mcq",
        question: "Which is the oldest hill station in Uttarakhand?",
        options: ["Mussoorie", "Nainital", "Almora", "Ranikhet"],
        correctAnswer: "Mussoorie",
        explanation: "Mussoorie, established as a hill station by the British in 1823, is the oldest hill station in Uttarakhand.",
        difficulty: "medium",
        topic: "Uttarakhand GK - History",
        source: "UKPSC PCS 2024",
        examName: "UKPSC",
        year: 2024
    },
    {
        id: "ukpsc-2024-new-013",
        type: "mcq",
        question: "The Ganga and Yamuna rivers originate from which glaciers respectively?",
        options: ["Gangotri and Yamunotri", "Pindari and Milam", "Satopanth and Gangotri", "Milam and Pindari"],
        correctAnswer: "Gangotri and Yamunotri",
        explanation: "The Ganga (Bhagirathi) originates from Gangotri Glacier and Yamuna originates from Yamunotri Glacier.",
        difficulty: "easy",
        topic: "Uttarakhand GK - Geography",
        source: "UKPSC PCS 2024",
        examName: "UKPSC",
        year: 2024
    },
    {
        id: "ukpsc-2024-new-014",
        type: "mcq",
        question: "Which famous fair is held at the confluence of Ganga and Yamuna in Uttarakhand?",
        options: ["Nanda Devi Mela", "Kumbh Mela", "Magh Mela", "Jhanda Mela"],
        correctAnswer: "Kumbh Mela",
        explanation: "The Kumbh Mela is held at Haridwar, one of the four sacred sites where the Kumbh rotates every 12 years.",
        difficulty: "easy",
        topic: "Uttarakhand GK - Culture",
        source: "UKPSC PCS 2024",
        examName: "UKPSC",
        year: 2024
    },
    {
        id: "ukpsc-2024-new-015",
        type: "mcq",
        question: "Which university is the oldest in Uttarakhand?",
        options: ["Kumaun University", "HNB Garhwal University", "GBPUAT Pantnagar", "Doon University"],
        correctAnswer: "GBPUAT Pantnagar",
        explanation: "G.B. Pant University of Agriculture and Technology, Pantnagar, established in 1960, is the oldest university in Uttarakhand.",
        difficulty: "medium",
        topic: "Uttarakhand GK - Education",
        source: "UKPSC PCS 2024",
        examName: "UKPSC",
        year: 2024
    }
];

// New SSC CGL Questions
const newSSC2024 = [
    {
        id: "ssc-cgl-2024-new-001",
        type: "mcq",
        question: "Which Indian state shares the longest border with Bangladesh?",
        options: ["West Bengal", "Assam", "Tripura", "Meghalaya"],
        correctAnswer: "West Bengal",
        explanation: "West Bengal shares approximately 2,217 km of border with Bangladesh, the longest among all Indian states.",
        difficulty: "medium",
        topic: "General Awareness - Geography",
        source: "SSC CGL 2024",
        examName: "SSC CGL",
        year: 2024
    },
    {
        id: "ssc-cgl-2024-new-002",
        type: "mcq",
        question: "Who is known as the 'Father of the Indian Constitution'?",
        options: ["Mahatma Gandhi", "Jawaharlal Nehru", "B.R. Ambedkar", "Sardar Patel"],
        correctAnswer: "B.R. Ambedkar",
        explanation: "Dr. B.R. Ambedkar, as Chairman of the Drafting Committee, is known as the Father of the Indian Constitution.",
        difficulty: "easy",
        topic: "General Awareness - Polity",
        source: "SSC CGL 2024",
        examName: "SSC CGL",
        year: 2024
    },
    {
        id: "ssc-cgl-2024-new-003",
        type: "mcq",
        question: "The RBI was established in which year?",
        options: ["1935", "1947", "1949", "1950"],
        correctAnswer: "1935",
        explanation: "The Reserve Bank of India was established on April 1, 1935 under the Reserve Bank of India Act, 1934.",
        difficulty: "easy",
        topic: "General Awareness - Economy",
        source: "SSC CGL 2024",
        examName: "SSC CGL",
        year: 2024
    },
    {
        id: "ssc-cgl-2024-new-004",
        type: "mcq",
        question: "If 20% of A = 30% of B, then A:B is?",
        options: ["2:3", "3:2", "1:2", "2:1"],
        correctAnswer: "3:2",
        explanation: "20% of A = 30% of B → A/5 = 3B/10 → A = 15B/10 = 3B/2 → A:B = 3:2",
        difficulty: "medium",
        topic: "Quantitative Aptitude - Ratio",
        source: "SSC CGL 2024",
        examName: "SSC CGL",
        year: 2024
    },
    {
        id: "ssc-cgl-2024-new-005",
        type: "mcq",
        question: "Select the antonym of 'ARROGANT':",
        options: ["Proud", "Humble", "Haughty", "Bold"],
        correctAnswer: "Humble",
        explanation: "Arrogant means having an exaggerated sense of one's importance. Humble means modest, the opposite meaning.",
        difficulty: "easy",
        topic: "English - Vocabulary",
        source: "SSC CGL 2024",
        examName: "SSC CGL",
        year: 2024
    },
    {
        id: "ssc-cgl-2024-new-006",
        type: "mcq",
        question: "Which planet is known as the 'Red Planet'?",
        options: ["Venus", "Mars", "Jupiter", "Saturn"],
        correctAnswer: "Mars",
        explanation: "Mars is called the Red Planet because of its reddish appearance caused by iron oxide (rust) on its surface.",
        difficulty: "easy",
        topic: "General Awareness - Science",
        source: "SSC CGL 2024",
        examName: "SSC CGL",
        year: 2024
    },
    {
        id: "ssc-cgl-2024-new-007",
        type: "mcq",
        question: "The Green Revolution in India was started by?",
        options: ["Verghese Kurien", "M.S. Swaminathan", "Norman Borlaug", "C. Subramaniam"],
        correctAnswer: "M.S. Swaminathan",
        explanation: "M.S. Swaminathan is known as the Father of Green Revolution in India for his role in introducing high-yielding varieties of wheat.",
        difficulty: "medium",
        topic: "General Awareness - Agriculture",
        source: "SSC CGL 2024",
        examName: "SSC CGL",
        year: 2024
    },
    {
        id: "ssc-cgl-2024-new-008",
        type: "mcq",
        question: "Complete the series: 2, 5, 10, 17, 26, ?",
        options: ["35", "36", "37", "38"],
        correctAnswer: "37",
        explanation: "Pattern: +3, +5, +7, +9, +11. So 26 + 11 = 37. (Differences increase by 2 each time)",
        difficulty: "medium",
        topic: "Reasoning - Number Series",
        source: "SSC CGL 2024",
        examName: "SSC CGL",
        year: 2024
    },
    {
        id: "ssc-cgl-2024-new-009",
        type: "mcq",
        question: "Which vitamin is produced when skin is exposed to sunlight?",
        options: ["Vitamin A", "Vitamin C", "Vitamin D", "Vitamin E"],
        correctAnswer: "Vitamin D",
        explanation: "Vitamin D is synthesized in the skin when exposed to ultraviolet B (UVB) rays from sunlight.",
        difficulty: "easy",
        topic: "General Awareness - Science",
        source: "SSC CGL 2024",
        examName: "SSC CGL",
        year: 2024
    },
    {
        id: "ssc-cgl-2024-new-010",
        type: "mcq",
        question: "The Jallianwala Bagh massacre occurred in which year?",
        options: ["1917", "1919", "1920", "1922"],
        correctAnswer: "1919",
        explanation: "The Jallianwala Bagh massacre occurred on April 13, 1919, when British troops under General Dyer opened fire on peaceful protesters.",
        difficulty: "easy",
        topic: "General Awareness - History",
        source: "SSC CGL 2024",
        examName: "SSC CGL",
        year: 2024
    }
];

// New UKSSSC Questions
const newUKSSSC2024 = [
    {
        id: "uksssc-2024-new-001",
        type: "mcq",
        question: "Which is the winter capital of Uttarakhand?",
        options: ["Dehradun", "Nainital", "Gairsain", "Haridwar"],
        correctAnswer: "Dehradun",
        explanation: "Dehradun serves as the winter capital of Uttarakhand while Gairsain is the summer capital.",
        difficulty: "easy",
        topic: "Uttarakhand GK - Administration",
        source: "UKSSSC 2024",
        examName: "UKSSSC",
        year: 2024
    },
    {
        id: "uksssc-2024-new-002",
        type: "mcq",
        question: "The Corbett Tiger Reserve spans across how many districts?",
        options: ["1", "2", "3", "4"],
        correctAnswer: "2",
        explanation: "Corbett Tiger Reserve spans across Nainital and Pauri Garhwal districts in Uttarakhand.",
        difficulty: "medium",
        topic: "Uttarakhand GK - Wildlife",
        source: "UKSSSC 2024",
        examName: "UKSSSC",
        year: 2024
    },
    {
        id: "uksssc-2024-new-003",
        type: "mcq",
        question: "Who wrote the famous book 'My Kumaon'?",
        options: ["Rahul Sankrityayan", "Sumitranandan Pant", "Ruskin Bond", "Jim Corbett"],
        correctAnswer: "Jim Corbett",
        explanation: "Jim Corbett, the famous hunter and naturalist, wrote 'My Kumaon' based on his experiences in the Kumaon region.",
        difficulty: "medium",
        topic: "Uttarakhand GK - Literature",
        source: "UKSSSC 2024",
        examName: "UKSSSC",
        year: 2024
    },
    {
        id: "uksssc-2024-new-004",
        type: "mcq",
        question: "The Nanda Devi Biosphere Reserve was established in which year?",
        options: ["1982", "1988", "1992", "1998"],
        correctAnswer: "1988",
        explanation: "The Nanda Devi Biosphere Reserve was established in 1988 and became a UNESCO World Heritage Site.",
        difficulty: "hard",
        topic: "Uttarakhand GK - Environment",
        source: "UKSSSC 2024",
        examName: "UKSSSC",
        year: 2024
    },
    {
        id: "uksssc-2024-new-005",
        type: "mcq",
        question: "Which river is known as 'Rishiganga' in Uttarakhand?",
        options: ["Alaknanda", "Dhauliganga", "Pushpawati", "Rishi Ganga"],
        correctAnswer: "Rishi Ganga",
        explanation: "Rishi Ganga is a tributary of the Dhauli Ganga and flows through the Nanda Devi National Park area.",
        difficulty: "hard",
        topic: "Uttarakhand GK - Geography",
        source: "UKSSSC 2024",
        examName: "UKSSSC",
        year: 2024
    },
    {
        id: "uksssc-2024-new-006",
        type: "mcq",
        question: "The Auli ski resort is located in which district?",
        options: ["Chamoli", "Uttarkashi", "Rudraprayag", "Pithoragarh"],
        correctAnswer: "Chamoli",
        explanation: "Auli, the famous skiing destination, is located in Chamoli district at an altitude of about 2,500-3,000 meters.",
        difficulty: "easy",
        topic: "Uttarakhand GK - Tourism",
        source: "UKSSSC 2024",
        examName: "UKSSSC",
        year: 2024
    },
    {
        id: "uksssc-2024-new-007",
        type: "mcq",
        question: "Which is the State Flower of Uttarakhand?",
        options: ["Lily", "Brahma Kamal", "Lotus", "Rhododendron"],
        correctAnswer: "Brahma Kamal",
        explanation: "Brahma Kamal (Saussurea obvallata) is the State Flower of Uttarakhand. It blooms at high altitudes.",
        difficulty: "easy",
        topic: "Uttarakhand GK - Symbols",
        source: "UKSSSC 2024",
        examName: "UKSSSC",
        year: 2024
    },
    {
        id: "uksssc-2024-new-008",
        type: "mcq",
        question: "The Kedarnath temple was built by which king?",
        options: ["Ajay Pal", "Kalyan Singh", "Adi Shankaracharya", "Raja Bhoj"],
        correctAnswer: "Adi Shankaracharya",
        explanation: "The Kedarnath temple is believed to have been built by Adi Shankaracharya in the 8th century.",
        difficulty: "medium",
        topic: "Uttarakhand GK - Culture",
        source: "UKSSSC 2024",
        examName: "UKSSSC",
        year: 2024
    },
    {
        id: "uksssc-2024-new-009",
        type: "mcq",
        question: "Which tribe is NOT found in Uttarakhand?",
        options: ["Bhotiya", "Tharu", "Jaunsari", "Santhal"],
        correctAnswer: "Santhal",
        explanation: "Santhal tribe is primarily found in Jharkhand and West Bengal. Bhotiya, Tharu, and Jaunsari are Uttarakhand tribes.",
        difficulty: "medium",
        topic: "Uttarakhand GK - Demographics",
        source: "UKSSSC 2024",
        examName: "UKSSSC",
        year: 2024
    },
    {
        id: "uksssc-2024-new-010",
        type: "mcq",
        question: "The Bhagirathi and Alaknanda meet at which place to form the Ganga?",
        options: ["Rudraprayag", "Devprayag", "Karnaprayag", "Vishnuprayag"],
        correctAnswer: "Devprayag",
        explanation: "The Bhagirathi and Alaknanda rivers meet at Devprayag to form the River Ganga.",
        difficulty: "easy",
        topic: "Uttarakhand GK - Geography",
        source: "UKSSSC 2024",
        examName: "UKSSSC",
        year: 2024
    }
];

// Add new questions to existing arrays
data.ukpsc["2024"] = [...data.ukpsc["2024"], ...newUKPSC2024];
data.ssc_cgl["2024"] = [...data.ssc_cgl["2024"], ...newSSC2024];
data.uksssc["2024"] = [...data.uksssc["2024"], ...newUKSSSC2024];

// Write back to file
writeFileSync(dbPath, JSON.stringify(data, null, 4), 'utf-8');

console.log('Questions added successfully!');
console.log(`UKPSC 2024: ${data.ukpsc["2024"].length} questions`);
console.log(`SSC CGL 2024: ${data.ssc_cgl["2024"].length} questions`);
console.log(`UKSSSC 2024: ${data.uksssc["2024"].length} questions`);
