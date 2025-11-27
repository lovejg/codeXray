import express from "express";
import { githubCallback, getRepos } from "../controllers/githubController.js";
const router = express.Router();

router.get("/login", (req, res) => {
  const redirectUri = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo`;
  res.redirect(redirectUri);
});
router.get("/callback", githubCallback);
router.get("/repos", getRepos);

export default router;
