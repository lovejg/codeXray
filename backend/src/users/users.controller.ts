import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChangePasswordDto, DeleteAccountDto } from './dto/users.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: '내 프로필 조회', description: '로그인 사용자의 상세 프로필 + 풀이/노트 카운트.' })
  getMyProfile(@Req() req: any) {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch('me/password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: '비밀번호 변경',
    description: 'LOCAL provider 전용. 현재 비밀번호 검증 후 새 비밀번호 저장.',
  })
  changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(
      req.user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({
    summary: '회원 탈퇴',
    description:
      'LOCAL → password 입력 / OAuth → confirmNickname 입력. 개인 자산은 cascade 삭제, 커뮤니티 글/댓글은 익명화 보존.',
  })
  deleteMe(@Req() req: any, @Body() dto: DeleteAccountDto) {
    return this.usersService.deleteAccount(req.user.id, dto);
  }

  @Get(':id/stats')
  @ApiOperation({
    summary: '공개 프로필 통계',
    description: '닉네임 / 가입일 / 풀이 수 / 티어 패밀리 분포 / 알고리즘 태그 분포. 인증 불필요.',
  })
  getPublicStats(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getPublicStats(id);
  }
}
