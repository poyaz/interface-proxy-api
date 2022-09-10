import {Injectable} from '@nestjs/common';
import {ISystemInfoRepositoryInterface} from '@src-core/interface/i-system-info-repository.interface';
import {RepositoryException} from '@src-core/exception/repository.exception';
import {AsyncReturn} from '@src-utility-type';
import {IIdentifier} from '@src-core/interface/i-identifier.interface';
import {IpInterfaceModel} from '@src-core/model/ip-interface.model';
import {networkInterfaces} from 'os';
import {defaultModelFactory} from '@src-core/model/defaultModel';
import {FilterModel, SortEnum} from '@src-core/model/filter.model';
import {sortListObject} from '@src-infrastructure/utility/utility';
import {filterAndSortIpInterface} from '@src-infrastructure/utility/filterAndSortIpInterface';

@Injectable()
export class SystemInfoRepository implements ISystemInfoRepositoryInterface {
  constructor(private readonly _identifier: IIdentifier) {
  }

  async getAllNetworkInterface<F>(filter?: F): Promise<AsyncReturn<Error, Array<IpInterfaceModel>>> {
    const filterModel = filter instanceof FilterModel
      ? <FilterModel<IpInterfaceModel>><any>filter
      : new FilterModel<IpInterfaceModel>();

    try {
      const nets = networkInterfaces();

      const allIpList: Array<IpInterfaceModel> = [];
      for (const name of Object.keys(nets)) {
        if (/^(docker|br|lo).*/.exec(name)) {
          continue;
        }

        for (const net of nets[name]) {
          if (net.family === 'IPv6') {
            continue;
          }

          allIpList.push(this._fillIpInterfaceModel({...net, ...{name}}));
        }
      }

      if (allIpList.length === 0) {
        return [null, [], 0];
      }

      return [null, ...filterAndSortIpInterface(allIpList, filterModel)];
    } catch (error) {
      return [new RepositoryException(error)];
    }
  }

  async getNetworkInterfaceById(id: string): Promise<AsyncReturn<Error, IpInterfaceModel | null>> {
    const skipPaginationFilter = new FilterModel<IpInterfaceModel>({skipPagination: true});
    const [ipError, ipList, ipTotalCount] = await this.getAllNetworkInterface(skipPaginationFilter);
    if (ipError) {
      return [ipError];
    }
    if (ipTotalCount === 0) {
      return [null, null];
    }

    const find = ipList.find((v) => v.id === id);
    if (!find) {
      return [null, null];
    }

    return [null, find];
  }

  private _fillIpInterfaceModel(entity) {
    const model = new IpInterfaceModel({
      id: this._identifier.generateId(entity.name),
      name: entity.name,
      ip: entity.cidr.split('/')[0],
      isUse: false,
    });

    return defaultModelFactory(IpInterfaceModel, model, ['isUse']);
  }
}
