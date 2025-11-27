import axios from "axios";

export const githubCallback = async (req, res) => {
  const { code } = req.query;

  const tokenRes = await axios.post(
    "https://github.com/login/oauth/access_token",
    {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    },
    { headers: { Accept: "application/json" } }
  );

  const accessToken = tokenRes.data.access_token;
  res.redirect(`http://localhost:5173/github?token=${accessToken}`);
};

export const getRepos = async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];

  const repoRes = await axios.get("https://api.github.com/user/repos", {
    headers: { Authorization: `Bearer ${token}` },
  });

  res.json(repoRes.data);
};
