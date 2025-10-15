import Field from "../models/Field.js";
import Question from "../models/Question.js";
import UserProgress from "../models/UserProgress.js";


// Create field (admin only)
export const createField = async (req, res) => {
  try {
    const { name, description, defaultTimePerQuestion, for: targetFor } = req.body;

    const field = new Field({
      name,
      description,
      defaultTimePerQuestion,
      for: targetFor,          // 'Student' or 'general'
      createdBy: req.user._id, // admin who created
    });

    await field.save();
    res.status(201).json(field);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
// List all fields (auth required)
export const getFields = async (req, res) => {
  try {
    const fields = await Field.find().sort({ createdAt: -1 });
    res.json(fields);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// export const getFields = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     // Fetch the fields from the database
//     const fields = await Field.find().sort({ createdAt: -1 });

//     // Find the fields that the user has already completed
//     const userCompletedFields = await UserProgress.find({ user: userId }).select('field').lean();

//     // Extract the field IDs that the user has already completed
//     const completedFieldIds = userCompletedFields.map((progress) => progress.field.toString());

//     // Filter out the fields that the user has already completed
//     const availableFields = fields.filter(field => !completedFieldIds.includes(field._id.toString()));

//     res.json(availableFields);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };
// Get single field by ID
export const getFieldById = async (req, res) => {
  try {
    const field = await Field.findById(req.params.id);
    if (!field) return res.status(404).json({ error: "Field not found" });
    res.json(field);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const getFieldWithQuestions = async (req, res) => {
  try {
    const fieldId = req.params.id;

    // Find the field
    const field = await Field.findById(fieldId);
    if (!field) return res.status(404).json({ error: "Field not found" });

    // Find all questions for this field
    const questions = await Question.find({ field: fieldId }).sort({ createdAt: -1 });

    res.json({
      field,
      questions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Update field (admin only)
export const updateField = async (req, res) => {
  try {
    const { name, description, defaultTimePerQuestion, for: targetFor } = req.body;

    const field = await Field.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        defaultTimePerQuestion,
        for: targetFor,
      },
      { new: true, runValidators: true }
    );

    if (!field) return res.status(404).json({ error: "Field not found" });

    res.json(field);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
// Delete field (admin only)
export const deleteField = async (req, res) => {
  try {
    const field = await Field.findByIdAndDelete(req.params.id);
    if (!field) return res.status(404).json({ error: "Field not found" });

    res.json({ message: "Field deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
