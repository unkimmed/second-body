import { IsString, IsInt, IsIn, IsDateString, Min, Max } from 'class-validator';
import { CreateSymptomDto as ICreateSymptomDto, BodyPart } from '@second-body/shared';

const BODY_PARTS: BodyPart[] = ['head', 'chest', 'abdomen', 'back', 'arm', 'leg', 'skin', 'other'];

export class CreateSymptomDto implements ICreateSymptomDto {
  @IsDateString()
  date: string;

  @IsIn(BODY_PARTS)
  body_part: BodyPart;

  @IsInt()
  @Min(1)
  @Max(5)
  severity: 1 | 2 | 3 | 4 | 5;

  @IsString()
  title: string;

  @IsString()
  description: string;
}
