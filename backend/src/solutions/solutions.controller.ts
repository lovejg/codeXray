import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SolutionsService } from './solutions.service';
import { CreateSolutionDto, UpdateSolutionDto, UpsertMemoDto } from './dto/solution.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('solutions')
@UseGuards(JwtAuthGuard)
export class SolutionsController {
  constructor(private readonly solutionsService: SolutionsService) {}

  @Get()
  findMyAll(@Req() req: any, @Query('starred') starred?: string) {
    const starredBool = starred === 'true' ? true : starred === 'false' ? false : undefined;
    return this.solutionsService.findMyAll(req.user.id, starredBool);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.solutionsService.findOne(id, req.user.id);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateSolutionDto) {
    return this.solutionsService.create(req.user.id, dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() dto: UpdateSolutionDto,
  ) {
    return this.solutionsService.update(id, req.user.id, dto);
  }

  @Patch(':id/star')
  toggleStar(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.solutionsService.toggleStar(id, req.user.id);
  }

  @Put(':id/memo')
  upsertMemo(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() dto: UpsertMemoDto,
  ) {
    return this.solutionsService.upsertMemo(id, req.user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.solutionsService.remove(id, req.user.id);
  }
}
