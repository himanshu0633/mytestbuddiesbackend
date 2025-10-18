import Field from "../models/Field.js";
import Question from "../models/Question.js";
import UserProgress from "../models/UserProgress.js";

// ✅ Create question under a field (admin only)
export const createQuestion = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const { type, text, options, correctAnswer, solution, timeAllocated } = req.body;

    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    if (!text?.trim()) return res.status(400).json({ error: 'Question text is required' });

    const field = await Field.findById(fieldId);
    if (!field) return res.status(404).json({ error: 'Field not found' });

    const question = await Question.create({
      field: fieldId,
      type,
      text,
      options,
      correctAnswer,
      solution,
      timeAllocated,
      createdBy: req.user.id,
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

// ✅ Get all questions for a field (admin or user)
export const getQuestionsByField = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const questions = await Question.find({ field: fieldId }).sort({ createdAt: -1 }).lean();

    if (!req.user?.isAdmin) {
      const safeQuestions = questions.map(({ correctAnswer, solution, ...rest }) => rest);
      return res.json({ success: true, questions: safeQuestions });
    }

    res.json({ success: true, questions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ Submit user answers for a field (track progress)
export const submitAnswers = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: "Unauthorized" });

    const { fieldId, answers } = req.body;
    if (!fieldId || !Array.isArray(answers)) {
      return res.status(400).json({ error: "Invalid request body" });
    }

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

    const questionIds = answers.map(a => a.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } });

    let totalCorrect = 0;
    for (let answer of answers) {
      const question = questions.find(q => q._id.toString() === answer.questionId);
      if (question) {
        const userAnswer = answer.answer.trim().toLowerCase();
        const correctAnswer = question.correctAnswer?.trim().toLowerCase() || '';
        const isCorrect = userAnswer === correctAnswer;

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
    res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ Get user progress for a field
export const getUserProgress = async (req, res) => {
  try {
    const { fieldId } = req.params;
    const userProgress = await UserProgress.findOne({
      user: req.user.id,
      field: fieldId,
    }).populate("questionsAnswered.question");

    if (!userProgress) {
      return res.status(404).json({ error: "No progress found for this field" });
    }

    res.json({ success: true, progress: userProgress });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
