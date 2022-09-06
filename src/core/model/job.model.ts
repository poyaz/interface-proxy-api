import {ModelRequireProp} from '@src-utility-type';

export enum JobStatusEnum {
  STATUS_PENDING = 'pending',
  STATUS_PROCESSING = 'processing',
  STATUS_SUCCESS = 'success',
  STATUS_FAIL = 'fail',
}

export class JobModel<JobType> {
  id: string;
  type: JobType;
  data: string;
  status: JobStatusEnum;
  totalRecord: number;
  totalRecordAdd: number;
  totalRecordExist: number;
  totalRecordDelete: number;
  totalRecordError: number;
  stdout: string;
  stderr: string;

  constructor(props: ModelRequireProp<typeof JobModel.prototype>) {
    Object.assign(this, props);
  }

  clone() {
    return Object.assign(Object.create(this), this);
  }
}
