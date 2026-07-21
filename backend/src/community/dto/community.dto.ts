import {
  IsString,
  IsEnum,
  IsInt,
  IsOptional,
  IsBoolean,
  IsIn,
  MinLength,
  MaxLength,
} from 'class-validator';
import { PostType, ReportStatus, SuggestionStatus } from '@prisma/client';

export class CreatePostDto {
  @IsOptional()
  @IsInt()
  problemId?: number;

  @IsEnum(PostType)
  type: PostType;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  content: string;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(20000)
  content?: string;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}

export class UpdateStatusDto {
  @IsEnum(SuggestionStatus)
  status: SuggestionStatus;
}

export class UpdateAdminReplyDto {
  @IsString()
  @MaxLength(5000)
  adminReply: string;
}

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;
}

export class VotePostDto {
  @IsInt()
  @IsIn([1, -1])
  value: 1 | -1;
}

export class CreateReportDto {
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  reason: string;
}

export class UpdateReportDto {
  @IsEnum(ReportStatus)
  status: ReportStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  adminNote?: string;
}

export class HidePostDto {
  @IsBoolean()
  hidden: boolean;
}
