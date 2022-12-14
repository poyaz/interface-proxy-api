import {AsyncReturn} from '@src-utility-type';
import {IpInterfaceModel} from '@src-core/model/ip-interface.model';

export interface ISystemInfoRepositoryInterface {
  getAllNetworkInterface<F>(filter?: F): Promise<AsyncReturn<Error, Array<IpInterfaceModel>>>;

  getNetworkInterfaceById(id: string): Promise<AsyncReturn<Error, IpInterfaceModel | null>>;
}
