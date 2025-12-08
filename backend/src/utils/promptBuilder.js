export function generatePrompt(code, options = {}, userPrompt = "") {
  // 기본 프롬프트 생성
  const basePrompt = `첨부한 코드를 분석하여 아래 항목을 설명해주세요:
1. 프로젝트 개요
2. 기술 스택
3. 주요 기능
4. 폴더/파일별 역할
5. 핵심 로직
`;

  // 사용자 옵션 선택에 따른 프롬프트 추가
  const optionMap = {
    architecture: "- 아키텍처 및 의존성 구조를 설명해주세요.",
    security: "- 잠재적인 보안 취약점을 지적해주세요.",
    performance: "- 성능 개선 방법을 제안해주세요.",
    testing: "- 테스트 누락 및 개선 제안을 해주세요.",
  };

  let optionPrompt = "\n[추가 분석 요청]\n";
  Object.entries(optionMap).forEach(([key, text]) => {
    if (options?.[key]) optionPrompt += `${text}\n`;
  });

  // 사용자 커스텀 프롬프트 추가
  let userPromptBlock = "";
  if (userPrompt && userPrompt.trim() !== "") {
    userPromptBlock = `\n[사용자 추가 요청]\n${userPrompt}\n`;
  }

  return `${basePrompt}${optionPrompt}${userPromptBlock}\n[코드]\n${code}`;
}
