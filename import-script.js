const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, 'server', 'data', 'official-questions.json');
try {
const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

if (!data.ssc_cgl) data.ssc_cgl = {};
if (!data.ssc_cgl['2025']) data.ssc_cgl['2025'] = [];

const newQuestions = [
  { question: 'A hollow spherical shell has inner radius 3 cm and outer radius 5 cm. If it is melted to form a solid cylinder of radius 4 cm, what is the height of the cylinder?', options: ['49/6 cm', '14/3 cm', '9/5 cm', '12/5 cm'], correctAnswer: '49/6 cm', topic: 'Mensuration', explanation: 'Volume of hollow sphere = (4/3)π(R³ - r³) = (4/3)π(125 - 27) = (4/3)π(98). Volume of cylinder = πr²h = π(16)h. Equating both: h = 49/6 cm.', difficulty: 'hard' },
  { question: 'Select the most appropriate SYNONYM of the given word: OBFUSCATE', options: ['Clarify', 'Confuse', 'Illuminate', 'Simplify'], correctAnswer: 'Confuse', topic: 'English Comprehension', explanation: 'Obfuscate means to make something obscure, unclear, or unintelligible, which is synonymous with confuse.', difficulty: 'medium' },
  { question: 'If A + B means A is the father of B, A - B means A is the mother of B, A * B means A is the brother of B. What does P * Q - R mean?', options: ['P is the uncle of R', 'P is the father of R', 'P is the brother of R', 'P is the son of R'], correctAnswer: 'P is the uncle of R', topic: 'Reasoning', explanation: 'P * Q means P is the brother of Q. Q - R means Q is the mother of R. Therefore, P is the brother of R\\\'s mother, making him the maternal uncle of R.', difficulty: 'medium' },
  { question: 'Which of the following Articles of the Indian Constitution is related to the protection of life and personal liberty?', options: ['Article 19', 'Article 21', 'Article 20', 'Article 22'], correctAnswer: 'Article 21', topic: 'Polity', explanation: 'Article 21 declares that no person shall be deprived of his life or personal liberty except according to procedure established by law.', difficulty: 'medium' },
  { question: 'The difference between the compound interest and simple interest on a certain sum of money for 2 years at 10% per annum is Rs. 250. Find the sum.', options: ['Rs. 25,000', 'Rs. 20,000', 'Rs. 50,000', 'Rs. 10,000'], correctAnswer: 'Rs. 25,000', topic: 'Quantitative Aptitude', explanation: 'Difference for 2 years CI and SI = P(R/100)². So, 250 = P(10/100)² => P = 250 * 100 = 25000.', difficulty: 'medium' },
  { question: 'In a certain code language, "FROZEN" is written as "OFAPSG". How will "MOLTEN" be written in that language?', options: ['OFUMPN', 'OFUMPQ', 'OFUMNO', 'OFUNPM'], correctAnswer: 'OFUMPN', topic: 'Reasoning', explanation: 'Reverse the word and add +1 to each letter.', difficulty: 'hard' },
  { question: 'Who won the Men\\\'s Singles title at the 2025 Australian Open?', options: ['Jannik Sinner', 'Novak Djokovic', 'Carlos Alcaraz', 'Daniil Medvedev'], correctAnswer: 'Jannik Sinner', topic: 'Current Affairs', explanation: 'Jannik Sinner successfully defended his title at the 2025 Australian Open.', difficulty: 'medium' },
  { question: 'Find the greatest number that will divide 398, 436 and 542 leaving remainders 7, 11 and 15 respectively.', options: ['17', '11', '34', '19'], correctAnswer: '17', topic: 'Quantitative Aptitude', explanation: 'Required number is HCF of (391, 425, 527) = 17.', difficulty: 'hard' },
  { question: 'Identify the segment in the sentence which contains a grammatical error: "The teacher asked the students whether they had finish their project."', options: ['The teacher asked', 'the students whether', 'they had finish', 'their project.'], correctAnswer: 'they had finish', topic: 'English Comprehension', explanation: 'With "had", the past participle verbs are used. It should be "they had finished".', difficulty: 'easy' },
  { question: 'A train 150m long takes 20 seconds to cross a platform 450m long. What is the speed of the train in km/hr?', options: ['108 km/hr', '72 km/hr', '90 km/hr', '120 km/hr'], correctAnswer: '108 km/hr', topic: 'Quantitative Aptitude', explanation: 'Total distance = 150 + 450 = 600m. Speed = Distance/Time = 30 m/s. In km/hr: 30 * 18/5 = 108 km/hr.', difficulty: 'medium' },
  { question: 'Which of the following is NOT an allotrope of Carbon?', options: ['Diamond', 'Graphite', 'Buckminsterfullerene', 'Corundum'], correctAnswer: 'Corundum', topic: 'General Science', explanation: 'Corundum is a crystalline form of aluminium oxide, not carbon.', difficulty: 'medium' },
  { question: 'Sita starts from point A and walks 2 km North, then she turns right and walks 3 km, again she turns right and walks 2 km. In which direction is she now with respect to point A?', options: ['West', 'North', 'East', 'South'], correctAnswer: 'East', topic: 'Reasoning', explanation: 'She walked North, right (East), right (South) equal distance to North, meaning she is purely East of start.', difficulty: 'easy' },
  { question: 'In a triangle ABC, the bisector of angle A meets BC at D. If AB = 8 cm, AC = 10 cm and BC = 9 cm, find the length of BD.', options: ['3 cm', '4 cm', '5 cm', '6 cm'], correctAnswer: '4 cm', topic: 'Geometry', explanation: 'Angle bisector theorem: BD/DC = AB/AC = 8/10 = 4/5. BD = 4.', difficulty: 'hard' },
  { question: 'What is the SI unit of luminous intensity?', options: ['Lumen', 'Lux', 'Candela', 'Watt'], correctAnswer: 'Candela', topic: 'General Science', explanation: 'The SI unit of luminous intensity is the candela (cd).', difficulty: 'easy' },
  { question: 'Select the most appropriate meaning of the given idiom: "Break the ice"', options: ['To start a quarrel', 'To end a friendship', 'To initiate a conversation', 'To break an obstacle'], correctAnswer: 'To initiate a conversation', topic: 'English Comprehension', explanation: 'Break the ice means to relieve tension or start a conversation in a social setting.', difficulty: 'easy' },
  { question: 'X and Y are partners sharing profits in the ratio 4 : 5. They admit Z for 1/3rd share of profits. What will be their new profit sharing ratio?', options: ['8:10:9', '4:5:1', '4:5:3', '12:15:3'], correctAnswer: '8:10:9', topic: 'Quantitative Aptitude', explanation: 'Remaining share = 1 - 1/3 = 2/3. X = (4/9)*2/3 = 8/27. Y = (5/9)*2/3 = 10/27. Z = 1/3 = 9/27.', difficulty: 'medium'},
  { question: 'Match the classical dance forms with their states: \n1. Bharatanatyam A. UP \n2. Kathak B. Kerala \n3. Kathakali C. Tamil Nadu', options: ['1-C, 2-A, 3-B', '1-A, 2-C, 3-B', '1-B, 2-A, 3-C', '1-C, 2-B, 3-A'], correctAnswer: '1-C, 2-A, 3-B', topic: 'Art & Culture', explanation: 'Bharatanatyam is from Tamil Nadu, Kathak from UP, Kathakali from Kerala.', difficulty: 'medium'}
];

const existingQuestions = data.ssc_cgl['2025'];
const newToAdd = newQuestions.filter(nq => !existingQuestions.find(eq => eq.question === nq.question));
data.ssc_cgl['2025'].push(...newToAdd);
fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
console.log('Successfully added ' + newToAdd.length + ' SSC CGL 2025 Realistic Questions to JSON database!');
} catch (e) {
  console.error(e);
}
