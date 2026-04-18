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
  BodyPartCode,
  CreateSymptomDetailDto as ICreateSymptomDetailDto,
  CreateSymptomRecordDto as ICreateSymptomRecordDto,
} from '@second-body/shared';

const BODY_PART_CODES: BodyPartCode[] = [
  'head', 'neck',
  'left_shoulder', 'right_shoulder',
  'left_upper_arm', 'right_upper_arm',
  'left_elbow', 'right_elbow',
  'left_forearm', 'right_forearm',
  'left_wrist', 'right_wrist',
  'chest', 'abdomen', 'upper_back', 'lower_back',
  'left_hip', 'right_hip',
  'left_thigh', 'right_thigh',
  'left_knee', 'right_knee',
  'left_calf', 'right_calf',
  'left_ankle', 'right_ankle',
];

export class CreateSymptomDetailDto implements ICreateSymptomDetailDto {
  @IsIn(BODY_PART_CODES)
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
