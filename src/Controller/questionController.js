import Field from "../models/Field.js";
import Question from "../models/Question.js";
import UserProgress from "../models/UserProgress.js";

// ✅ Create question under a field (admin only)
export const createQuestion = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const { type, text, options, correctAnswer, solution, timeAllocated } = req.body;

    // Find the field
    const field = await Field.findById(fieldId);
    if (!field) return res.status(404).json({ error: 'Field not found' });

    // Create the question
    const question = await Question.create({
      field: fieldId,
      type,
      text,
      options,
      correctAnswer,
      solution,
      timeAllocated,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      question,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ Get all questions for a field (for both admin and regular user)
export const getQuestionsByField = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const questions = await Question.find({ field: fieldId }).sort({ createdAt: -1 }).lean();

    // Hide answers for non-admin users
    if (!req.user?.isAdmin) {
      const safeQuestions = questions.map(({ correctAnswer, solution, ...rest }) => rest);
      return res.json({ success: true, questions: safeQuestions });
    }

    res.json({ success: true, questions });
  } catch (err) {
    console.error("Error fetching questions:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ Submit user answers for a field (track progress)
export const submitAnswers = async (req, res) => {
  try {
    const { fieldId, answers } = req.body; // answers: array of {questionId, answer}

    // Find the user progress for this field
    let userProgress = await UserProgress.findOne({ user: req.user._id, field: fieldId });
    if (!userProgress) {
      // If no progress exists, create a new one
      userProgress = new UserProgress({
        user: req.user._id,
        field: fieldId,
        questionsAnswered: [],
        totalCorrect: 0,
        totalAnswered: 0,
      });
    }

    // Process each answer
    let totalCorrect = 0;
    for (let answer of answers) {
      const question = await Question.findById(answer.questionId);
      if (question) {
        const isCorrect = question.correctAnswer === answer.answer;
        userProgress.questionsAnswered.push({ question: question._id, answer: answer.answer, isCorrect });
        if (isCorrect) totalCorrect++;
      }
    }

    // Update total correct and answered
    userProgress.totalCorrect = totalCorrect;
    userProgress.totalAnswered = answers.length;

    // Save the updated progress
    await userProgress.save();

    res.json({ success: true, progress: userProgress });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get user progress for a field
export const getUserProgress = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const userProgress = await UserProgress.findOne({ user: req.user._id, field: fieldId }).populate('questionsAnswered.question');
    if (!userProgress) {
      return res.status(404).json({ error: "No progress found for this field" });
    }

    res.json({ success: true, progress: userProgress });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
