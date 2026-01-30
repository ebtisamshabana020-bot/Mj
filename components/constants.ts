import { Exam } from '../types';

// Simulating a database of exams
export const MOCK_QUIZZES: Exam[] = [
  {
    id: "1",
    groupId: "g-default",
    creatorId: "admin",
    title: "General Science / علوم عامة",
    description: "Test your knowledge on basic physics and biology.",
    questions: [
      {
        id: "101",
        text: "What is the powerhouse of the cell?",
        options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi Apparatus"],
        correctAnswer: 1,
        type: 'MCQ'
      },
      {
        id: "102",
        text: "Which planet is known as the Red Planet?",
        options: ["Venus", "Mars", "Jupiter", "Saturn"],
        correctAnswer: 1,
        type: 'MCQ'
      },
      {
        id: "103",
        text: "What is the chemical symbol for Gold?",
        options: ["Au", "Ag", "Fe", "Cu"],
        correctAnswer: 0,
        type: 'MCQ'
      }
    ]
  },
  {
    id: "2",
    groupId: "g-default",
    creatorId: "admin",
    title: "History / تاريخ",
    description: "A quick look back at major historical events.",
    questions: [
      {
        id: "201",
        text: "In which year did World War II end?",
        options: ["1943", "1944", "1945", "1946"],
        correctAnswer: 2,
        type: 'MCQ'
      },
      {
        id: "202",
        text: "Who wrote 'Romeo and Juliet'?",
        options: ["Charles Dickens", "Jane Austen", "William Shakespeare", "Mark Twain"],
        correctAnswer: 2,
        type: 'MCQ'
      }
    ]
  }
];