import {FilterModel} from '@src-core/model/filter.model';
import {AsyncReturn} from '@src-utility-type';
import {IpInterfaceModel} from '@src-core/model/ip-interface.model';

export interface INetworkInterfaceRepositoryInterface {
  getAll(filter?: FilterModel<IpInterfaceModel>): Promise<AsyncReturn<Error, Array<IpInterfaceModel>>>;
}
