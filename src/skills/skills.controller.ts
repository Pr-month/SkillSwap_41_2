import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { CreateSkillDto } from './dto/create-skill.dto';
import { GetSkillsQueryDto } from './dto/get-skills';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { SkillsService } from './skills.service';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @UseGuards(JwtAccessGuard)
  @Post()
  create(@Body() createSkillDto: CreateSkillDto, @Request() req) {
    return this.skillsService.create(createSkillDto, req.user);
  }

  @Get()
  findAll(@Query() query: GetSkillsQueryDto) {
    return this.skillsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.skillsService.findOne(+id);
  }

  @UseGuards(JwtAccessGuard)
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
