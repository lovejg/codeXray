import { IsString, IsInt, IsBoolean, IsOptional } from 'class-validator';

export class CreateSolutionDto {
  @IsInt()
  problemId: number;

  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  language?: string;
}

export class UpdateSolutionDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsBoolean()
  starred?: boolean;
}

export class UpsertMemoDto {
  @IsOptional()
  @IsString()
  wrongReason?: string;

  @IsOptional()
  @IsString()
  logic?: string;

  @IsOptional()
  @IsString()
  keyFunctions?: string;

  @IsOptional()
  @IsString()
  freeNote?: string;
}
