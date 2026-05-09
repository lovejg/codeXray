import { IsOptional, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  newPassword: string;
}

export class DeleteAccountDto {
  /** LOCAL provider 는 비밀번호 검증, OAuth 는 nickname 입력 검증 */
  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  confirmNickname?: string;
}
