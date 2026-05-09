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

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
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
  unreadCount(@Req() req: any) {
    return this.service.unreadCount(req.user.id).then((count) => ({ count }));
  }

  @Patch('read-all')
  markAllRead(@Req() req: any) {
    return this.service.markAllRead(req.user.id);
  }

  @Patch('read')
  markRead(@Req() req: any, @Body() dto: MarkReadDto) {
    return this.service.markRead(req.user.id, dto.ids);
  }

  @Delete(':id')
  deleteOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.service.deleteOne(req.user.id, id);
  }
}
