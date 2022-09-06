import {ApiProperty, PartialType} from '@nestjs/swagger';
import {DateOutputDto} from '@src-api/http/dto/date-output.dto';
import {JobTypeEnum} from '@src-core/enum/job-type.enum';
import {JobModel, JobStatusEnum} from '@src-core/model/job.model';
import {instanceToPlain} from 'class-transformer';

export class FindJobOutputDto extends PartialType(DateOutputDto) {
  @ApiProperty({
    description: 'The identity of user',
    type: String,
    required: false,
    readOnly: true,
    example: '00000000-0000-0000-0000-000000000000',
  })
  id: string;

  @ApiProperty({
    description: 'The type of job',
    type: String,
    enum: JobTypeEnum,
    required: false,
    readOnly: true,
    example: JobTypeEnum.CREATE_PROXY_ON_INTERFACE,
  })
  type: JobTypeEnum;

  @ApiProperty({
    description: 'The result of job has been executed',
    type: String,
    enum: JobStatusEnum,
    required: false,
    readOnly: true,
    example: JobStatusEnum.STATUS_SUCCESS,
  })
  status: JobStatusEnum;

  @ApiProperty({
    description: 'The total record of job',
    required: false,
    readOnly: true,
    type: Number,
    example: 1,
  })
  totalRecord: number;

  @ApiProperty({
    description: 'The total record of job has been added',
    required: false,
    readOnly: true,
    type: Number,
    example: 1,
  })
  totalRecordAdd: number;

  @ApiProperty({
    description: 'The total record of job has been exist',
    required: false,
    readOnly: true,
    type: Number,
    example: 0,
  })
  totalRecordExist: number;

  @ApiProperty({
    description: 'The total record of job has been deleted',
    required: false,
    readOnly: true,
    type: Number,
    example: 0,
  })
  totalRecordDelete: number;

  @ApiProperty({
    description: 'The total record of job has been error',
    required: false,
    readOnly: true,
    type: Number,
    example: 0,
  })
  totalRecordError: number;

  @ApiProperty({
    description: 'The stdout of execute job',
    required: false,
    readOnly: true,
    type: String,
    example: '[INFO] The job has been executed successfully',
  })
  stdout: string;

  @ApiProperty({
    description: 'The stderr of execute job',
    required: false,
    readOnly: true,
    type: String,
    example: '[WARN] The Ip address not filled!',
  })
  stderr: string;

  static toObject(model: JobModel<any>): Object {
    return instanceToPlain(model, {excludePrefixes: ['data']});
  }
}
