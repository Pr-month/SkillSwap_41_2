import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { CreateSkillDto } from './dto/create-skill.dto';
import { GetSkillsQueryDto } from './dto/get-skills';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { SkillsService } from './skills.service';
import { TRequestWithUser } from 'src/auth/auth.types';
import { JwtAccessGuard } from 'src/auth/guards/jwt-access.guard';
import { GetSkillsQueryDto } from './dto/get-skills';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @UseGuards(JwtAccessGuard)
  @Post()
  create(@Req() req: TRequestWithUser, @Body() createSkillDto: CreateSkillDto) {
    return this.skillsService.create(createSkillDto, req.user.sub as number);
  }

  @Get()
  findAll(@Query() query: GetSkillsQueryDto) {
    return this.skillsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.skillsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSkillDto: UpdateSkillDto,
    @Request() req,
  ) {
    return this.skillsService.update(+id, updateSkillDto, req.user);
  }

  @UseGuards(JwtAccessGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.skillsService.remove(+id, req.user);
  }
}
