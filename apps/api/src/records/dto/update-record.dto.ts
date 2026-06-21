import { IsString, IsInt, IsIn, IsOptional, Min, Max } from 'class-validator'
import {
  BODY_PART_CODES,
  BodyPartCode,
  Severity,
  UpdateSymptomRecordDto as IUpdateSymptomRecordDto,
} from '@second-body/shared'

export class UpdateRecordDto implements IUpdateSymptomRecordDto {
  @IsOptional()
  @IsIn(BODY_PART_CODES as readonly string[])
  body_part_code?: BodyPartCode

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  severity?: Severity

  @IsOptional()
  @IsString()
  note?: string
}
