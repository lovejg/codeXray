import {
  IsString,
  IsInt,
  IsBoolean,
  IsOptional,
  MaxLength,
} from 'class-validator';

const CODE_MAX = 50000;
const MEMO_MAX = 5000;

export class CreateSolutionDto {
  @IsInt()
  problemId: number;

  @IsString()
  @MaxLength(CODE_MAX)
  code: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  language?: string;
}

export class UpdateSolutionDto {
  @IsOptional()
  @IsString()
  @MaxLength(CODE_MAX)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  language?: string;

  @IsOptional()
  @IsBoolean()
  starred?: boolean;
}

export class UpsertMemoDto {
  @IsOptional()
  @IsString()
  @MaxLength(MEMO_MAX)
  wrongReason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(MEMO_MAX)
  logic?: string;

  @IsOptional()
  @IsString()
  @MaxLength(MEMO_MAX)
  keyFunctions?: string;

  @IsOptional()
  @IsString()
  @MaxLength(MEMO_MAX)
  freeNote?: string;
}
