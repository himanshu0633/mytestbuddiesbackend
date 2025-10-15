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
// ✅ Submit user answers for a field (track progress)
export const submitAnswers = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(400).json({ error: "User not authenticated or missing from request" });
    }

    const { fieldId, answers } = req.body;
    let userProgress = await UserProgress.findOne({ user: req.user.id, field: fieldId });

    if (!userProgress) {
      userProgress = new UserProgress({
        user: req.user.id,
        field: fieldId,
        questionsAnswered: [],
        totalCorrect: 0,
        totalAnswered: 0,
      });
    }

    let totalCorrect = 0;
    for (let answer of answers) {
      const question = await Question.findById(answer.questionId);
      if (question) {
        // Normalize answers by trimming and making lowercase
        const userAnswerNormalized = answer.answer.trim().toLowerCase();
        const correctAnswerNormalized = question.correctAnswer.trim().toLowerCase();

        // Check if the normalized answers match
        const isCorrect = userAnswerNormalized === correctAnswerNormalized;

        userProgress.questionsAnswered.push({
          question: question._id,
          answer: answer.answer,
          isCorrect,
        });

        if (isCorrect) totalCorrect++;
      }
    }

    userProgress.totalCorrect = totalCorrect;
    userProgress.totalAnswered = answers.length;

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
    const userProgress = await UserProgress.findOne({ user: req.user.id, field: fieldId }).populate('questionsAnswered.question');
    if (!userProgress) {
      return res.status(404).json({ error: "No progress found for this field" });
    }

    res.json({ success: true, progress: userProgress });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
