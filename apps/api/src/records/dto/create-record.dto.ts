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

// 증상 기록 단위는 L3 코드만 허용
const BODY_PART_CODES: BodyPartCode[] = [
  // 머리·목
  'head', 'eye', 'nose', 'mouth', 'ear', 'skin_face', 'neck',
  // 왼쪽 팔
  'left_shoulder', 'left_upper_arm', 'left_elbow', 'left_forearm', 'left_wrist', 'left_hand',
  // 오른쪽 팔
  'right_shoulder', 'right_upper_arm', 'right_elbow', 'right_forearm', 'right_wrist', 'right_hand',
  // 몸통
  'chest', 'abdomen', 'back', 'lower_back', 'pelvis', 'hip', 'genitalia',
  // 왼쪽 다리
  'left_thigh', 'left_knee', 'left_calf', 'left_ankle', 'left_foot',
  // 오른쪽 다리
  'right_thigh', 'right_knee', 'right_calf', 'right_ankle', 'right_foot',
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
