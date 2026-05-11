import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsArray, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

class MarkReadDto {
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  ids: number[];
}

@ApiTags('Notifications')
@ApiBearerAuth('jwt')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: '내 알림 목록',
    description: '`?onlyUnread=true` / `?cursor={lastId}` / `?limit=N (max 50)`',
  })
  list(
    @Req() req: any,
    @Query('onlyUnread') onlyUnread?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.list(req.user.id, {
      onlyUnread: onlyUnread === 'true',
      cursor: cursor ? Number(cursor) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: '미읽음 카운트 (배지용 가벼운 폴링 응답)' })
  unreadCount(@Req() req: any) {
    return this.service.unreadCount(req.user.id).then((count) => ({ count }));
  }

  @Patch('read-all')
  @ApiOperation({ summary: '모두 읽음 처리' })
  markAllRead(@Req() req: any) {
    return this.service.markAllRead(req.user.id);
  }

  @Patch('read')
  @ApiOperation({ summary: '특정 알림들 읽음 처리 (id 배열)' })
  markRead(@Req() req: any, @Body() dto: MarkReadDto) {
    return this.service.markRead(req.user.id, dto.ids);
  }

  @Delete(':id')
  @ApiOperation({ summary: '알림 삭제' })
  deleteOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.deleteOne(req.user.id, id);
  }
}
