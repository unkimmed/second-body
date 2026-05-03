import {
  IsString,
  IsInt,
  IsIn,
  IsDateString,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  BODY_PART_CODES,
  BodyPartCode,
  CreateSymptomDetailDto as ICreateSymptomDetailDto,
  CreateSymptomRecordDto as ICreateSymptomRecordDto,
} from '@second-body/shared';

export class CreateSymptomDetailDto implements ICreateSymptomDetailDto {
  @IsIn(BODY_PART_CODES as readonly string[])
  declare body_part_code: BodyPartCode;

  @IsInt()
  @Min(1)
  @Max(5)
  declare severity: 1 | 2 | 3 | 4 | 5;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateRecordDto implements ICreateSymptomRecordDto {
  @IsDateString()
  declare record_date: string;

  @IsOptional()
  @IsString()
  overall_note?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSymptomDetailDto)
  declare details: CreateSymptomDetailDto[];
}
