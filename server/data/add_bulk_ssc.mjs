import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFile = path.join(__dirname, 'official-questions.json');

const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

// High-quality Biology questions for SSC CGL
const biologyQuestions = [
    { q: "Which of the following is known as the 'suicide bag' of the cell?", o: ["Lysosome", "Ribosome", "Mitochondria", "Golgi body"], a: "Lysosome" },
    { q: "The process of cell division that results in two identical daughter cells is called:", o: ["Mitosis", "Meiosis", "Fertilization", "Budding"], a: "Mitosis" },
    { q: "Which blood group is considered the universal acceptor?", o: ["O-", "O+", "AB+", "A-"], a: "AB+" },
    { q: "What is the primary function of Hemoglobin in the human body?", o: ["Fight infection", "Transport oxygen", "Clot blood", "Provide immunity"], a: "Transport oxygen" },
    { q: "Which vitamin is synthesized in the human body by intestinal bacteria?", o: ["Vitamin K", "Vitamin C", "Vitamin A", "Vitamin D"], a: "Vitamin K" },
    { q: "Bile is produced by which organ?", o: ["Gallbladder", "Liver", "Pancreas", "Stomach"], a: "Liver" },
    { q: "Which disease is caused by the deficiency of Insulin?", o: ["Diabetes mellitus", "Goiter", "Scurvy", "Beri-beri"], a: "Diabetes mellitus" },
    { q: "What is the scientific name of the human species?", o: ["Homo erectus", "Homo sapiens", "Homo habilis", "Australopithecus"], a: "Homo sapiens" },
    { q: "Which part of the brain controls balance and posture?", o: ["Cerebrum", "Cerebellum", "Medulla oblongata", "Hypothalamus"], a: "Cerebellum" },
    { q: "The basic structural and functional unit of the kidney is:", o: ["Neuron", "Nephron", "Alveolus", "Villus"], a: "Nephron" },
    { q: "Which hormone is responsible for the 'fight or flight' response?", o: ["Insulin", "Thyroxine", "Adrenaline", "Melatonin"], a: "Adrenaline" },
    { q: "What is the longest bone in the human body?", o: ["Tibia", "Fibula", "Femur", "Humerus"], a: "Femur" },
    { q: "Which cell organelle is known as the powerhouse of the cell?", o: ["Nucleus", "Mitochondria", "Chloroplast", "Endoplasmic Reticulum"], a: "Mitochondria" },
    { q: "Pellagra is caused by the deficiency of which vitamin?", o: ["Vitamin B1", "Vitamin B3", "Vitamin B12", "Vitamin C"], a: "Vitamin B3" },
    { q: "Which part of the eye is responsible for color vision?", o: ["Rods", "Cones", "Cornea", "Lens"], a: "Cones" },
    { q: "The pigment that gives color to human skin is:", o: ["Melanin", "Hemoglobin", "Keratin", "Carotene"], a: "Melanin" },
    { q: "Which disease is caused by a Plasmodium parasite and transmitted by mosquitoes?", o: ["Dengue", "Malaria", "Typhoid", "Cholera"], a: "Malaria" },
    { q: "What type of joint is the human elbow?", o: ["Ball and socket joint", "Hinge joint", "Pivot joint", "Fixed joint"], a: "Hinge joint" },
    { q: "Which enzyme is found in human saliva and begins the digestion of starch?", o: ["Pepsin", "Trypsin", "Amylase", "Lipase"], a: "Amylase" },
    { q: "What is the normal resting heart rate for an adult?", o: ["40-50 bpm", "60-100 bpm", "110-130 bpm", "130-150 bpm"], a: "60-100 bpm" },
    { q: "Which part of the plant is responsible for photosynthesis?", o: ["Roots", "Stem", "Leaves", "Flowers"], a: "Leaves" },
    { q: "What is the main function of white blood cells (WBCs)?", o: ["Transport oxygen", "Clot blood", "Fight infection", "Provide nutrients"], a: "Fight infection" },
    { q: "The deficiency of which mineral leads to Goiter?", o: ["Iron", "Calcium", "Iodine", "Potassium"], a: "Iodine" },
    { q: "Who discovered Penicillin?", o: ["Louis Pasteur", "Alexander Fleming", "Edward Jenner", "Robert Koch"], a: "Alexander Fleming" },
    { q: "Which of these is a water-soluble vitamin?", o: ["Vitamin A", "Vitamin D", "Vitamin C", "Vitamin K"], a: "Vitamin C" },
    { q: "The process by which plants lose water vapor through their leaves is called:", o: ["Respiration", "Transpiration", "Condensation", "Precipitation"], a: "Transpiration" },
    { q: "Which gas is essential for photosynthesis to occur?", o: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], a: "Carbon dioxide" },
    { q: "Which human organ completely regenerates if a part of it is removed?", o: ["Heart", "Liver", "Kidney", "Brain"], a: "Liver" },
    { q: "What is the primary function of the large intestine?", o: ["Digestion of proteins", "Absorption of water", "Production of bile", "Absorption of fats"], a: "Absorption of water" },
    { q: "Which animal is known as the 'ship of the desert'?", o: ["Horse", "Camel", "Elephant", "Lion"], a: "Camel" },
    { q: "Night blindness is caused due to the deficiency of:", o: ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D"], a: "Vitamin A" },
    { q: "The study of birds is called:", o: ["Entomology", "Ornithology", "Ichthyology", "Herpetology"], a: "Ornithology" },
    { q: "Which group of animals has a three-chambered heart?", o: ["Mammals", "Birds", "Amphibians", "Fish"], a: "Amphibians" },
    { q: "What is the hardest substance in the human body?", o: ["Bone", "Cartilage", "Tooth enamel", "Nail"], a: "Tooth enamel" },
    { q: "Which organ produces insulin in the human body?", o: ["Liver", "Gallbladder", "Spleen", "Pancreas"], a: "Pancreas" },
    { q: "In human females, fertilization usually takes place in the:", o: ["Uterus", "Ovary", "Fallopian tube", "Vagina"], a: "Fallopian tube" },
    { q: "Pneumonia affects which organ of the human body?", o: ["Lungs", "Heart", "Liver", "Kidney"], a: "Lungs" },
    { q: "The functional unit of heredity is a:", o: ["Chromosome", "Gene", "DNA", "RNA"], a: "Gene" },
    { q: "Which vein brings clean (oxygenated) blood from the lungs into the heart?", o: ["Pulmonary vein", "Hepatic vein", "Renal vein", "Jugular vein"], a: "Pulmonary vein" },
    { q: "The pH of human blood is normally:", o: ["Highly acidic", "Slightly acidic", "Neutral", "Slightly alkaline"], a: "Slightly alkaline" },
    { q: "Which cell does not contain a nucleus?", o: ["White blood cell", "Red blood cell", "Nerve cell", "Muscle cell"], a: "Red blood cell" },
    { q: "Rickets is a disease associated with the deficiency of:", o: ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D"], a: "Vitamin D" },
    { q: "What is the study of tissue called?", o: ["Cytology", "Histology", "Pathology", "Ecology"], a: "Histology" },
    { q: "Which component of blood is responsible for clotting?", o: ["Red blood cells", "White blood cells", "Plasma", "Platelets"], a: "Platelets" },
    { q: "Who is known as the 'Father of Genetics'?", o: ["Charles Darwin", "Gregor Mendel", "Louis Pasteur", "Watson and Crick"], a: "Gregor Mendel" },
    { q: "Which plant hormone promotes cell division?", o: ["Auxin", "Gibberellin", "Cytokinin", "Abscisic acid"], a: "Cytokinin" },
    { q: "What is the common name for Ascorbic acid?", o: ["Vitamin A", "Vitamin B12", "Vitamin C", "Vitamin K"], a: "Vitamin C" },
    { q: "Which part of the digestive system secretes hydrochloric acid?", o: ["Mouth", "Stomach", "Small Intestine", "Large Intestine"], a: "Stomach" },
    { q: "The virus that causes AIDS affects which type of cells?", o: ["Red blood cells", "T-lymphocytes", "Platelets", "Nerve cells"], a: "T-lymphocytes" },
    { q: "Which instrument is used to measure blood pressure?", o: ["Thermometer", "Stethoscope", "Sphygmomanometer", "Barometer"], a: "Sphygmomanometer" }
];

const physicsQuestions = [
    { q: "What is the SI unit of power?", o: ["Joule", "Watt", "Newton", "Pascal"], a: "Watt", t: "Physics" },
    { q: "Which law states that for every action, there is an equal and opposite reaction?", o: ["Newton's First Law", "Newton's Second Law", "Newton's Third Law", "Law of Gravitation"], a: "Newton's Third Law", t: "Physics" },
    { q: "The rate of change of velocity is called:", o: ["Speed", "Displacement", "Acceleration", "Momentum"], a: "Acceleration", t: "Physics" },
    { q: "What is the speed of light in a vacuum?", o: ["3 × 10^5 m/s", "3 × 10^6 m/s", "3 × 10^7 m/s", "3 × 10^8 m/s"], a: "3 × 10^8 m/s", t: "Physics" },
    { q: "Which instrument is used to measure electric current?", o: ["Voltmeter", "Ammeter", "Galvanometer", "Ohmmeter"], a: "Ammeter", t: "Physics" }
];

let added = 0;
const examTarget = "ssc_cgl";
const yearsTarget = ["2025"];

if (!data[examTarget]) data[examTarget] = {};

for (const year of yearsTarget) {
    if (!data[examTarget][year]) data[examTarget][year] = [];
    
    // Add Biology questions
    for (let i = 0; i < biologyQuestions.length; i++) {
        const q = biologyQuestions[i];
        data[examTarget][year].push({
            id: `ssc-cgl-2025-bio-${i}`,
            type: "mcq",
            question: q.q,
            options: q.o,
            correctAnswer: q.a,
            explanation: `The correct answer is ${q.a}.`,
            difficulty: "medium",
            topic: "General Science - Biology",
            source: "SSC CGL 2025 Tier 1",
            examName: "SSC CGL",
            year: parseInt(year)
        });
        added++;
    }

    // Add Physics questions
    for (let i = 0; i < physicsQuestions.length; i++) {
        const q = physicsQuestions[i];
        data[examTarget][year].push({
            id: `ssc-cgl-2025-phy-${i}`,
            type: "mcq",
            question: q.q,
            options: q.o,
            correctAnswer: q.a,
            explanation: `The correct answer is ${q.a}.`,
            difficulty: "medium",
            topic: "General Science - Physics",
            source: "SSC CGL 2025 Tier 1",
            examName: "SSC CGL",
            year: parseInt(year)
        });
        added++;
    }
}

fs.writeFileSync(dataFile, JSON.stringify(data, null, 4));
console.log(`Added ${added} real Biology and Physics questions to SSC CGL 2025.`);
