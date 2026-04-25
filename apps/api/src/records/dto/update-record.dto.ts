import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateSymptomRecordDto as IUpdateSymptomRecordDto } from '@second-body/shared';
import { CreateSymptomDetailDto } from './create-record.dto';

export class UpdateRecordDto implements IUpdateSymptomRecordDto {
  @IsOptional()
  @IsString()
  overall_note?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSymptomDetailDto)
  details?: CreateSymptomDetailDto[];
}
