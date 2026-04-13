import { PartialType } from '@nestjs/mapped-types';
import { CreateSymptomDto } from './create-symptom.dto';

// PartialType → CreateSymptomDto의 모든 필드를 optional로 만듦
export class UpdateSymptomDto extends PartialType(CreateSymptomDto) {}
