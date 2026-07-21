import { IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';

export enum AiTaskType {
  OPTIMIZE = 'optimize', // 코드 최적화
  EXPLAIN = 'explain', // 코드 설명
}

export class AiAnalyzeDto {
  // Claude API 비용 통제를 위해 코드 길이 상한
  @IsString()
  @MaxLength(20000)
  code: string;

  @IsEnum(AiTaskType)
  task: AiTaskType;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  language?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  problemTitle?: string;
}
