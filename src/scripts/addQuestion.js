import mongoose from "mongoose";
import dotenv from "dotenv";
import Question from "../models/Question.js";
import Field from "../models/Field.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/yourdbname";

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");

    const fieldId = "68f232e7c8f340d808f7c981"; 
    const userId = "68f00047f8cfab6fa5247724";

    const field = await Field.findById(fieldId);
    if (!field) throw new Error("Field not found");


    // ====== STEP 2: Create New Question ======
const questions = [
  {
    text: "Which country gifted the Statue of Liberty to the USA?",
    options: [{ text: "France" }, { text: "England" }, { text: "Germany" }, { text: "Italy" }],
    correctAnswer: "France",
    solution: "France gifted the Statue of Liberty to the United States in 1886."
  },
  {
    text: "What is the main gas found in the Earth's atmosphere?",
    options: [{ text: "Oxygen" }, { text: "Nitrogen" }, { text: "Carbon Dioxide" }, { text: "Hydrogen" }],
    correctAnswer: "Nitrogen",
    solution: "Nitrogen makes up about 78% of Earth's atmosphere."
  },
  {
    text: "Which is the fastest bird in the world?",
    options: [{ text: "Peregrine Falcon" }, { text: "Eagle" }, { text: "Hawk" }, { text: "Ostrich" }],
    correctAnswer: "Peregrine Falcon",
    solution: "The Peregrine Falcon can reach speeds over 320 km/h during a dive."
  },
  {
    text: "Who wrote the play 'Romeo and Juliet'?",
    options: [{ text: "William Shakespeare" }, { text: "Charles Dickens" }, { text: "Jane Austen" }, { text: "Leo Tolstoy" }],
    correctAnswer: "William Shakespeare",
    solution: "'Romeo and Juliet' is a tragedy written by William Shakespeare."
  },
  {
    text: "Which is the longest river in Africa?",
    options: [{ text: "Nile" }, { text: "Congo" }, { text: "Zambezi" }, { text: "Niger" }],
    correctAnswer: "Nile",
    solution: "The Nile River is the longest river in Africa, stretching over 6,650 km."
  },
  {
    text: "Which element has the chemical symbol 'Na'?",
    options: [{ text: "Sodium" }, { text: "Nitrogen" }, { text: "Neon" }, { text: "Nickel" }],
    correctAnswer: "Sodium",
    solution: "'Na' is the chemical symbol for Sodium."
  },
  {
    text: "Which planet is known for its rings?",
    options: [{ text: "Saturn" }, { text: "Jupiter" }, { text: "Uranus" }, { text: "Neptune" }],
    correctAnswer: "Saturn",
    solution: "Saturn is famous for its prominent ring system."
  },
  {
    text: "What is the capital city of Australia?",
    options: [{ text: "Sydney" }, { text: "Melbourne" }, { text: "Canberra" }, { text: "Perth" }],
    correctAnswer: "Canberra",
    solution: "Canberra is the capital city of Australia."
  },
  {
    text: "Which organ in the human body produces insulin?",
    options: [{ text: "Pancreas" }, { text: "Liver" }, { text: "Kidney" }, { text: "Spleen" }],
    correctAnswer: "Pancreas",
    solution: "The pancreas produces insulin to regulate blood sugar."
  },
  {
    text: "Which is the tallest building in the world?",
    options: [{ text: "Burj Khalifa" }, { text: "Shanghai Tower" }, { text: "One World Trade Center" }, { text: "Taipei 101" }],
    correctAnswer: "Burj Khalifa",
    solution: "Burj Khalifa in Dubai is the tallest building in the world."
  },
  {
    text: "Which is the largest desert in the world?",
    options: [{ text: "Sahara" }, { text: "Gobi" }, { text: "Arabian" }, { text: "Kalahari" }],
    correctAnswer: "Sahara",
    solution: "The Sahara Desert is the largest hot desert in the world."
  },
  {
    text: "Which is the largest internal organ of the human body?",
    options: [{ text: "Liver" }, { text: "Lungs" }, { text: "Heart" }, { text: "Kidney" }],
    correctAnswer: "Liver",
    solution: "The liver is the largest internal organ in the human body."
  },
  {
    text: "Who was the first woman Prime Minister of India?",
    options: [{ text: "Indira Gandhi" }, { text: "Sonia Gandhi" }, { text: "Pratibha Patil" }, { text: "Sarojini Naidu" }],
    correctAnswer: "Indira Gandhi",
    solution: "Indira Gandhi served as Prime Minister of India from 1966 to 1977 and 1980 to 1984."
  },
  {
    text: "Which is the largest species of shark?",
    options: [{ text: "Whale Shark" }, { text: "Great White Shark" }, { text: "Tiger Shark" }, { text: "Hammerhead Shark" }],
    correctAnswer: "Whale Shark",
    solution: "Whale Shark is the largest species of shark, reaching lengths of 12 meters or more."
  },
  {
    text: "Which is the largest continent in the Southern Hemisphere?",
    options: [{ text: "Australia" }, { text: "Africa" }, { text: "South America" }, { text: "Antarctica" }],
    correctAnswer: "Africa",
    solution: "Africa is the largest continent in the Southern Hemisphere."
  },
  {
    text: "Which is the largest city in Japan?",
    options: [{ text: "Tokyo" }, { text: "Osaka" }, { text: "Kyoto" }, { text: "Nagoya" }],
    correctAnswer: "Tokyo",
    solution: "Tokyo is the largest city in Japan by population."
  },
  {
    text: "Which is the largest ocean current?",
    options: [{ text: "Antarctic Circumpolar Current" }, { text: "Gulf Stream" }, { text: "Kuroshio Current" }, { text: "California Current" }],
    correctAnswer: "Antarctic Circumpolar Current",
    solution: "The Antarctic Circumpolar Current is the world's largest ocean current."
  },
  {
    text: "Which planet is known as the 'Evening Star'?",
    options: [{ text: "Venus" }, { text: "Mars" }, { text: "Jupiter" }, { text: "Mercury" }],
    correctAnswer: "Venus",
    solution: "Venus is often visible after sunset and is called the 'Evening Star'."
  },
  {
    text: "Which is the largest amphibian in the world?",
    options: [{ text: "Chinese Giant Salamander" }, { text: "Axolotl" }, { text: "Cane Toad" }, { text: "Bullfrog" }],
    correctAnswer: "Chinese Giant Salamander",
    solution: "The Chinese Giant Salamander can grow over 1.8 meters in length."
  },
  {
    text: "Which is the largest sea in the world?",
    options: [{ text: "Philippine Sea" }, { text: "Coral Sea" }, { text: "Arabian Sea" }, { text: "Mediterranean Sea" }],
    correctAnswer: "Philippine Sea",
    solution: "The Philippine Sea is the largest sea in the world."
  },
  {
    text: "Which is the largest city in the United States by area?",
    options: [{ text: "Sitka" }, { text: "New York" }, { text: "Los Angeles" }, { text: "Houston" }],
    correctAnswer: "Sitka",
    solution: "Sitka, Alaska, is the largest U.S. city by area."
  },
  {
    text: "Which is the largest coral island in the world?",
    options: [{ text: "Banana Reef" }, { text: "Maldive Islands" }, { text: "Great Nicobar" }, { text: "Andaman Island" }],
    correctAnswer: "Banana Reef",
    solution: "Banana Reef is one of the largest coral formations in the world."
  },
  {
    text: "Which is the largest lake in Africa?",
    options: [{ text: "Lake Victoria" }, { text: "Lake Tanganyika" }, { text: "Lake Malawi" }, { text: "Lake Chad" }],
    correctAnswer: "Lake Victoria",
    solution: "Lake Victoria is the largest lake in Africa by area."
  },
  {
    text: "Which is the largest freshwater river by discharge?",
    options: [{ text: "Amazon" }, { text: "Congo" }, { text: "Yangtze" }, { text: "Mississippi" }],
    correctAnswer: "Amazon",
    solution: "The Amazon River has the largest discharge volume of any river in the world."
  },
  {
    text: "Which is the largest planet in the inner solar system?",
    options: [{ text: "Earth" }, { text: "Venus" }, { text: "Mercury" }, { text: "Mars" }],
    correctAnswer: "Earth",
    solution: "Earth is the largest planet in the inner solar system."
  },
  {
    text: "Which is the largest state in the USA by area?",
    options: [{ text: "Alaska" }, { text: "Texas" }, { text: "California" }, { text: "Montana" }],
    correctAnswer: "Alaska",
    solution: "Alaska is the largest U.S. state by area."
  },
  {
    text: "Which is the largest island in the world?",
    options: [{ text: "Greenland" }, { text: "New Guinea" }, { text: "Borneo" }, { text: "Madagascar" }],
    correctAnswer: "Greenland",
    solution: "Greenland is the largest island in the world."
  },
  {
    text: "Which is the largest volcano in South America?",
    options: [{ text: "Ojos del Salado" }, { text: "Cotopaxi" }, { text: "Chimborazo" }, { text: "Parinacota" }],
    correctAnswer: "Ojos del Salado",
    solution: "Ojos del Salado on the Chile–Argentina border is the tallest volcano in South America."
  },
  {
    text: "Which is the largest planet in the outer solar system?",
    options: [{ text: "Jupiter" }, { text: "Saturn" }, { text: "Neptune" }, { text: "Uranus" }],
    correctAnswer: "Jupiter",
    solution: "Jupiter is the largest planet in the outer solar system."
  }
];









 const insertedQuestions = await Question.insertMany(
      questions.map(q => ({
        field: fieldId,
        type: "mcq",
        text: q.text,
        options: q.options,
        correctAnswer: q.correctAnswer,
        solution: q.solution,
        createdBy: userId
      }))
    );

    console.log("✅ Questions Added Successfully:");
    console.log(insertedQuestions); // <-- now logs all inserted questions

    await mongoose.disconnect();
    console.log("🔒 MongoDB disconnected");
  } catch (err) {
    console.error("❌ Error adding questions:", err.message);
    await mongoose.disconnect();
  }
};

run();




// in terminal :- node ./src/scripts/addQuestion.js
//  "scripts": {
  //   "dev": "node src/app.js",
  //   "add:question": "node server/scripts/addQuestion.js"
  // },




  // or .env ko src k andar copy krna hoga.




//   Mujhe 30 multiple choice questions chahiye MongoDB ke liye, iss format me:

// {
//     text: "Question text here",
//     options: [
//         { text: "Option 1" },
//         { text: "Option 2" },
//         { text: "Option 3" },
//         { text: "Option 4" }
//     ],
//     correctAnswer: "Correct Option Text",
//     solution: "Explanation for the correct answer"
// }

// Questions general knowledge aur science se ho. Sirf naye aur unique questions generate karo, jo pehle diye gaye questions se alag ho. 
