import express from "express";
import {
  githubCallback,
  getRepos,
  deleteGithubIntegration,
  startGithubLogin,
} from "../controllers/githubController.js";
const router = express.Router();

router.get("/login", startGithubLogin);
router.get("/callback", githubCallback);
router.get("/repos", getRepos);
router.delete("/integration", deleteGithubIntegration);

export default router;
