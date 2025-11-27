import axios from "axios";
import Admzip from "adm-zip";

export async function fetchGithubRepo(repoUrl) {
  const apiUrl =
    repoUrl.replace("github.com", "api.github.com/repos") + "/zipball";

  const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
  const zip = new Admzip(response.data);

  let combinedCode = "";

  zip.getEntries().forEach((entry) => {
    if (
      !entry.isDirectory &&
      /\.(js|ts|jsx|tsx|json|md)$/i.test(entry.entryName)
    ) {
      combinedCode += `
// FILE: ${entry.entryName}
`;
      combinedCode += entry.getData().toString("utf8") + "\n";
    }
  });

  return combinedCode;
}
