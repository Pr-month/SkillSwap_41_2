import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TRequestWithUser } from 'src/auth/auth.types';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';
import { CreateSkillDto } from './dto/create-skill.dto';
import { GetSkillsQueryDto } from './dto/get-skills.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { SkillsService } from './skills.service';
import {
  ApiAddToFavorites,
  ApiCreateSkill,
  ApiFindAllSkills,
  ApiFindOneSkill,
  ApiFindSimilar,
  ApiRemoveFromFavorites,
  ApiRemoveSkill,
  ApiUpdateSkill,
} from './skills.swagger';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @ApiAddToFavorites()
  @UseGuards(JwtAccessGuard)
  @Post(':id/favorite')
  async addToFavorites(@Param('id') id: string, @Req() req: TRequestWithUser) {
    return this.skillsService.addToFavorites(+id, req.user.sub);
  }

  @ApiRemoveFromFavorites()
  @UseGuards(JwtAccessGuard)
  @Delete(':id/favorite')
  async removeFromFavorites(
    @Param('id') id: string,
    @Req() req: TRequestWithUser,
  ) {
    return this.skillsService.removeFromFavorites(+id, req.user.sub);
  }

  @ApiCreateSkill()
  @UseGuards(JwtAccessGuard)
  @Post()
  create(@Req() req: TRequestWithUser, @Body() createSkillDto: CreateSkillDto) {
    return this.skillsService.create(createSkillDto, req.user.sub);
  }

  @ApiFindAllSkills()
  @Get()
  findAll(@Query() query: GetSkillsQueryDto) {
    return this.skillsService.findAll(query);
  }

  @ApiFindOneSkill()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.skillsService.findOne(+id);
  }

  @ApiUpdateSkill()
  @UseGuards(JwtAccessGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSkillDto: UpdateSkillDto,
    @Req() req: TRequestWithUser,
  ) {
    return this.skillsService.update(+id, updateSkillDto, req.user.sub);
  }

  @ApiRemoveSkill()
  @UseGuards(JwtAccessGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: TRequestWithUser) {
    return this.skillsService.remove(+id, req.user.sub);
  }

  @ApiFindSimilar()
  @Get(':id/similar')
  async findSimilar(@Param('id') id: string) {
    return this.skillsService.findSimilarUsers(+id);
  }
}
