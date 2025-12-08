import mongoose from "mongoose";

const AnalysisSchema = new mongoose.Schema({
  code: String,
  result: String,
  options: Object,
  userPrompt: String,
  model: {
    provider: String,
    model: String,
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Analysis", AnalysisSchema);
