import {
  IsString,
  IsEnum,
  IsInt,
  IsUrl,
  IsOptional,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { ProblemSource } from '@prisma/client';

export class CreateProblemDto {
  @IsString()
  title: string;

  @IsEnum(ProblemSource)
  source: ProblemSource;

  @IsInt()
  @Min(0)
  @Max(5)
  level: number;

  @IsUrl()
  link: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  tagIds?: number[];
}

export class UpdateProblemDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(ProblemSource)
  source?: ProblemSource;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  level?: number;

  @IsOptional()
  @IsUrl()
  link?: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  tagIds?: number[];
}

export class ProblemFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ProblemSource)
  source?: ProblemSource;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(14)
  tierMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(14)
  tierMax?: number;

  @IsOptional()
  @IsInt()
  tagId?: number;

  @IsOptional()
  @IsString()
  sortBy?: 'title' | 'level' | 'createdAt';

  @IsOptional()
  @IsString()
  order?: 'asc' | 'desc';

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2000)
  pageSize?: number;
}
