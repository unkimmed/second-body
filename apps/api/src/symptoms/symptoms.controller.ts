import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Headers,
} from '@nestjs/common';
import { SymptomsService } from './symptoms.service';
import { CreateSymptomDto } from './dto/create-symptom.dto';
import { UpdateSymptomDto } from './dto/update-symptom.dto';

// 임시로 헤더에서 user-id를 받는 방식 사용
// 실제 서비스에서는 JWT 인증 미들웨어로 교체 필요
@Controller('symptoms')
export class SymptomsController {
  constructor(private readonly symptomsService: SymptomsService) {}

  // GET /api/symptoms
  @Get()
  findAll(@Headers('x-user-id') userId: string) {
    return this.symptomsService.findAll(userId);
  }

  // GET /api/symptoms/:id
  @Get(':id')
  findOne(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    return this.symptomsService.findOne(id, userId);
  }

  // POST /api/symptoms
  @Post()
  create(
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateSymptomDto,
  ) {
    return this.symptomsService.create(userId, dto);
  }

  // PATCH /api/symptoms/:id
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
    @Body() dto: UpdateSymptomDto,
  ) {
    return this.symptomsService.update(id, userId, dto);
  }

  // DELETE /api/symptoms/:id
  @Delete(':id')
  remove(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    return this.symptomsService.remove(id, userId);
  }
}
