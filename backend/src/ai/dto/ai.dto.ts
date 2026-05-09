import { IsString, IsEnum, IsOptional } from 'class-validator';

export enum AiTaskType {
  OPTIMIZE = 'optimize', // 코드 최적화
  EXPLAIN = 'explain',   // 코드 설명
}

export class AiAnalyzeDto {
  @IsString()
  code: string;

  @IsEnum(AiTaskType)
  task: AiTaskType;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  problemTitle?: string;
}
