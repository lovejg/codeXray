import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { AiAnalyzeDto, AiTaskType } from './dto/ai.dto';

@Injectable()
export class AiService {
  private readonly client: Anthropic;

  constructor(private readonly config: ConfigService) {
    this.client = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  async analyze(dto: AiAnalyzeDto): Promise<{ result: string }> {
    const prompt = this.buildPrompt(dto);

    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system:
        '당신은 알고리즘 코딩테스트 전문 AI 어시스턴트입니다. ' +
        '코드 분석, 최적화, 알고리즘 태그 추천, 난이도 평가를 전문으로 합니다. ' +
        '답변은 한국어로 작성하고, 명확하고 구체적으로 설명하세요.',
      messages: [{ role: 'user', content: prompt }],
    });

    const result = message.content[0].type === 'text' ? message.content[0].text : '';
    return { result };
  }

  private buildPrompt(dto: AiAnalyzeDto): string {
    const { code, task, language = 'python', problemTitle } = dto;
    const lang = language;
    const title = problemTitle ? `문제명: ${problemTitle}\n` : '';

    const prompts: Record<AiTaskType, string> = {
      [AiTaskType.OPTIMIZE]: `${title}다음 ${lang} 코드를 시간복잡도와 공간복잡도 측면에서 최적화해주세요.\n개선 포인트와 최적화된 코드를 함께 제시해주세요.\n\n\`\`\`${lang}\n${code}\n\`\`\``,

      [AiTaskType.EXPLAIN]: `${title}다음 ${lang} 코드의 풀이 논리를 단계별로 설명해주세요.\n어떤 알고리즘을 사용했는지, 핵심 자료구조가 무엇인지 포함해서 설명해주세요.\n\n\`\`\`${lang}\n${code}\n\`\`\``,
    };

    return prompts[task];
  }
}
