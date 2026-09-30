import type { AIDifficulty } from "@/lib/ai/types";

export type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: AIDifficulty;
};

export type QuizQuestionProvider = {
  getQuestions(): Promise<QuizQuestion[]>;
};

const localQuestions: QuizQuestion[] = [
  { id: 1, question: "Which planet is known for its visible rings?", options: ["Mars", "Saturn", "Venus", "Mercury"], correctAnswer: 1, category: "Science", difficulty: "easy" },
  { id: 2, question: "What does HTML primarily describe?", options: ["Page structure", "Photo filters", "Computer hardware", "Sound waves"], correctAnswer: 0, category: "Technology", difficulty: "easy" },
  { id: 3, question: "What is 12 multiplied by 8?", options: ["86", "92", "96", "108"], correctAnswer: 2, category: "Mathematics", difficulty: "easy" },
  { id: 4, question: "Which ocean is the largest?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correctAnswer: 3, category: "Geography", difficulty: "easy" },
  { id: 5, question: "Which gas do plants take in during photosynthesis?", options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Helium"], correctAnswer: 2, category: "Science", difficulty: "medium" },
  { id: 6, question: "Which device is commonly used to move a pointer on a computer?", options: ["Mouse", "Router", "Printer", "Speaker"], correctAnswer: 0, category: "Technology", difficulty: "easy" },
  { id: 7, question: "How many sides does a hexagon have?", options: ["Five", "Six", "Seven", "Eight"], correctAnswer: 1, category: "Mathematics", difficulty: "easy" },
  { id: 8, question: "The ancient city of Rome was founded on which continent?", options: ["Europe", "Africa", "Asia", "South America"], correctAnswer: 0, category: "History", difficulty: "medium" },
  { id: 9, question: "What is the freezing point of water on the Celsius scale?", options: ["-10 degrees", "0 degrees", "10 degrees", "32 degrees"], correctAnswer: 1, category: "General Knowledge", difficulty: "easy" },
  { id: 10, question: "Which tool is used to measure temperature?", options: ["Barometer", "Compass", "Thermometer", "Altimeter"], correctAnswer: 2, category: "General Knowledge", difficulty: "easy" },
];

export const localQuizQuestionProvider: QuizQuestionProvider = {
  async getQuestions() {
    return localQuestions.map((question) => ({ ...question, options: [...question.options] }));
  },
};

export async function getQuizQuestions(provider: QuizQuestionProvider = localQuizQuestionProvider): Promise<QuizQuestion[]> {
  try {
    const questions = await provider.getQuestions();
    if (questions.length > 0 && questions.every(isSafeQuestion)) return questions;
  } catch {
    return localQuizQuestionProvider.getQuestions();
  }
  return localQuizQuestionProvider.getQuestions();
}

function isSafeQuestion(question: QuizQuestion): boolean {
  return Boolean(question.question.trim())
    && question.options.length >= 2
    && Number.isInteger(question.correctAnswer)
    && question.correctAnswer >= 0
    && question.correctAnswer < question.options.length;
}
