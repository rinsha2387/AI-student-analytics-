const AIPrompt = require("../models/AIPrompt");

const DEFAULT_PROMPT = `
You are an AI assistant for student analytics.

Analyze the provided student data, using only evidence available
in the supplied records.

Generate:
1. An executive summary.
2. Students who may require additional review and why.
3. Academic performance insights based on marks.
4. Attendance insights.
5. Evidence-based student behavior summaries, only when the
   supplied data supports them.
6. Potential financial impact, only where sufficient data and
   clearly stated assumptions exist.
7. Data quality observations.
8. Supporting indicators and suggested management reviews.

Do not invent missing data, diagnoses, causes, or financial figures.
Distinguish observed facts from estimates.
Treat risk categories as review indicators, not final judgments.
Return a clear, structured JSON result.
`;

async function getPrompt(req, res) {
  try {
    const prompt = await AIPrompt.findOne({ status: "active" })
      .sort({ updatedAt: -1 });

    return res.json({
      success: true,
      prompt,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve the AI prompt.",
    });
  }
}

async function initializePrompt(req, res) {
  try {
    let prompt = await AIPrompt.findOne({ status: "active" });

    if (!prompt) {
      prompt = await AIPrompt.create({
        systemInstruction: DEFAULT_PROMPT,
        outputSections: [
          "executiveSummary",
          "studentsRequiringReview",
          "academicInsights",
          "attendanceInsights",
          "behavioralInsights",
          "financialImpact",
          "dataQualityObservations",
          "supportingIndicators",
          "managementReviewSuggestions",
        ],
        createdBy: req.user?._id,
        updatedBy: req.user?._id,
      });
    }

    return res.status(200).json({
      success: true,
      message: "AI prompt is ready.",
      prompt,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to initialize the AI prompt.",
    });
  }
}

async function savePrompt(req, res) {
  try {
    const {
      name,
      description,
      systemInstruction,
      outputSections,
    } = req.body;

    if (
      typeof systemInstruction !== "string" ||
      !systemInstruction.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "A master prompt is required.",
      });
    }

    let prompt = await AIPrompt.findOne({ status: "active" })
      .sort({ updatedAt: -1 });

    if (prompt) {
      prompt.name = name || prompt.name;
      prompt.description = description ?? prompt.description;
      prompt.systemInstruction = systemInstruction.trim();

      if (Array.isArray(outputSections)) {
        prompt.outputSections = outputSections;
      }

      prompt.updatedBy = req.user?._id;
      prompt.version = `v${Date.now()}`;
      await prompt.save();
    } else {
      prompt = await AIPrompt.create({
        name,
        description,
        systemInstruction: systemInstruction.trim(),
        outputSections,
        createdBy: req.user?._id,
        updatedBy: req.user?._id,
      });
    }

    return res.json({
      success: true,
      message: "AI prompt saved successfully.",
      prompt,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to save the AI prompt.",
    });
  }
}

module.exports = {
  getPrompt,
  initializePrompt,
  savePrompt,
};