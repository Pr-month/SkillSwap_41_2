import { Controller, UseGuards, Post, Req, Body, Get, Query, Param, Patch, Delete } from "@nestjs/common";
import { TRequestWithUser } from "src/auth/auth.types";
import { JwtAccessGuard } from "src/auth/guards/jwt-access.guard";
import { CreateSkillDto } from "./dto/create-skill.dto";
import { GetSkillsQueryDto } from "./dto/get-skills";
import { UpdateSkillDto } from "./dto/update-skill.dto";
import { SkillsService } from "./skills.service";

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

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSkillDto: UpdateSkillDto,
    @Req() req,
  ) {
    return this.skillsService.update(+id, updateSkillDto, req.user);
  }

  @UseGuards(JwtAccessGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.skillsService.remove(+id, req.user);
  }
}
