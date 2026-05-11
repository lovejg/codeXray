import { Controller, Get, Post, Delete, Body, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @ApiOperation({ summary: '알고리즘 태그 목록', description: '문제 필터/카운트 포함. 인증 불필요.' })
  findAll() {
    return this.tagsService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: '태그 추가' })
  create(@Body('name') name: string) {
    return this.tagsService.create(name);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOperation({ summary: '태그 삭제' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tagsService.remove(id);
  }
}
