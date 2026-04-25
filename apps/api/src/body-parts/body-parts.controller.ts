import { Controller, Get } from '@nestjs/common';
import { BodyPartsService } from './body-parts.service';

@Controller('body-parts')
export class BodyPartsController {
  constructor(private readonly bodyPartsService: BodyPartsService) {}

  // GET /api/body-parts
  @Get()
  findAll() {
    return this.bodyPartsService.findAll();
  }
}
