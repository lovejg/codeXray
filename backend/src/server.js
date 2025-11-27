import "dotenv/config";
import express from "express";
import cors from "cors";
import analysisRoutes from "./routes/analysis.routes.js";
import githubRoutes from "./routes/github.routes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/api", analysisRoutes);
app.use("/api/github", githubRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`CodeXray Backend 동작 중`);
});
