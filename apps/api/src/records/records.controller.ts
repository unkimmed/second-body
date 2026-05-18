import { Controller, Get, Post, Patch, Delete, Body, Param, Headers } from '@nestjs/common'
import { RecordsService } from './records.service'
import { CreateRecordDto } from './dto/create-record.dto'
import { UpdateRecordDto } from './dto/update-record.dto'

@Controller('records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  // GET /api/records
  @Get()
  findAll(@Headers('x-user-id') userId: string) {
    return this.recordsService.findAll(userId)
  }

  // GET /api/records/today
  @Get('today')
  findToday(@Headers('x-user-id') userId: string) {
    return this.recordsService.findToday(userId)
  }

  // GET /api/records/:id
  @Get(':id')
  findOne(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    return this.recordsService.findOne(id, userId)
  }

  // POST /api/records
  @Post()
  create(@Headers('x-user-id') userId: string, @Body() dto: CreateRecordDto) {
    return this.recordsService.create(userId, dto)
  }

  // PATCH /api/records/:id
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
    @Body() dto: UpdateRecordDto,
  ) {
    return this.recordsService.update(id, userId, dto)
  }

  // DELETE /api/records/:id
  @Delete(':id')
  remove(@Param('id') id: string, @Headers('x-user-id') userId: string) {
    return this.recordsService.remove(id, userId)
  }
}
