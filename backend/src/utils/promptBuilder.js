export function generatePrompt(
  code,
  options = {},
  userPrompt = "",
  mode = "analysis"
) {
  // 기본 프롬프트 생성
  const basePrompt = `당신은 코드 분석 전문가입니다. 첨부한 코드를 분석하여 다음을 설명해주세요:
## 1. 프로젝트 개요
 - 이 코드의 목적과 역할
 - 주요 사용 사례

## 2. 기술 스택
 - 사용된 언어, 프레임워크, 라이브러리
 - 주요 의존성

## 3. 주요 기능
 - 핵심 기능들(리스트 형식)
 - 각 기능의 동작 방식

## 4. 폴더/파일별 역할
 - 디렉토리 및 파일별 역할
 - 모듈 간 관계도

## 5. 핵심 로직
 - 가장 중요한 알고리즘이나 비즈니스 로직
 - 복잡한 부분에 대한 설명

 분석 시 이해하기 쉽고 구체적인 예시를 포함해주는 것도 좋을 것 같습니다.
`;

  // 사용자 옵션 선택에 따른 프롬프트 추가
  const optionMap = {
    architecture: "- 아키텍처 패턴과 의존성 구조를 설명해주세요.",
    security: "- 잠재적인 보안 취약점과 개선 방안을 지적해주세요.",
    performance: "- 성능 최적화 가능 영역과 개선 사항을 제안해주세요.",
    testing: "- 테스트 누락을 찾아 우선순위별 테스트 케이스를 제안해주세요.",
    style: "- 코드 스타일/린트 문제를 지적하고 자동 수정 예시를 제안해주세요.",
    dependencies:
      "- 의존성 관리, 버전 호환성, 불필요한 라이브러리 사용을 분석해주세요.",
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

  if (mode === "summarize") {
    return `당신은 코드 요약 전문가입니다. 아래 코드를 짧고 간결하게 요약해주세요. 주요 목적, 사용된 기술, 핵심 함수/모듈, 발견된 문제(있다면 한두 문장)만 포함하세요. 출력은 일반 텍스트로 간결하게 작성하세요.\n\n[코드]\n${code}`;
  }

  const jsonSchemaInstruction = `\n[출력 형식 요구사항]\n1) 먼저 마크다운 형태의 보고서를 제공합니다 (Short Summary, Tech Stack, Key Functionality, File Roles, Key Logic, Issues & Recommendations, Next Steps).\n2) 그 다음 줄부터는 정확한 JSON 객체만 출력하세요. JSON 스키마는 다음을 포함해야 합니다 (필수): {"summary":"short text","techStack":[],"files":[],"issues":[],"recommendations":[]} 각 issue 항목은 {"id","type","severity","location":{"file","line"},"description","suggestedFix","patch"} 형태로 작성하세요. JSON 외의 추가 텍스트는 포함하지 마세요.`;

  return `${basePrompt}${optionPrompt}${userPromptBlock}${jsonSchemaInstruction}\n[코드]\n${code}`;
}
