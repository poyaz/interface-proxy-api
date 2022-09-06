import {AsyncReturn} from '@src-utility-type';

export interface ISystemInfoRepositoryInterface {
  getOutgoingIpAddress(): Promise<AsyncReturn<Error, string>>;
}
