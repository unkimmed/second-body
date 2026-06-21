import { IsString, IsInt, IsIn, IsDateString, IsOptional, Min, Max } from 'class-validator'
import {
  BODY_PART_CODES,
  BodyPartCode,
  Severity,
  CreateSymptomRecordDto as ICreateSymptomRecordDto,
} from '@second-body/shared'

export class CreateRecordDto implements ICreateSymptomRecordDto {
  @IsDateString()
  declare record_date: string

  @IsIn(BODY_PART_CODES as readonly string[])
  declare body_part_code: BodyPartCode

  @IsInt()
  @Min(1)
  @Max(5)
  declare severity: Severity

  @IsOptional()
  @IsString()
  note?: string
}
