import {Injectable} from '@nestjs/common';
import {ISystemInfoRepositoryInterface} from '@src-core/interface/i-system-info-repository.interface';
import {RepositoryException} from '@src-core/exception/repository.exception';
import {AsyncReturn} from '@src-utility-type';
import {IIdentifier} from '@src-core/interface/i-identifier.interface';
import {IpInterfaceModel} from '@src-core/model/ip-interface.model';
import {networkInterfaces} from 'os';
import {defaultModelFactory} from '@src-core/model/defaultModel';
import {FilterModel, SortEnum} from '@src-core/model/filter.model';
import {sortListObject} from '@src-infrastructure/utility';

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

      return [null, ...SystemInfoRepository._paginationAndFilterData(allIpList, filterModel)];
    } catch (error) {
      return [new RepositoryException(error)];
    }
  }

  async getAllNetworkInterfaceById(id: string): Promise<AsyncReturn<Error, IpInterfaceModel>> {
    return Promise.resolve(undefined);
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

  private static _paginationAndFilterData(ipList: Array<IpInterfaceModel>, filterModel: FilterModel<IpInterfaceModel>): [Array<IpInterfaceModel>, number] {
    let dataList = ipList;

    if (filterModel.getLengthOfCondition() > 0) {
      const getNameFilter = filterModel.getCondition('name');
      if (getNameFilter) {
        dataList = dataList.filter((v) => v.name === getNameFilter.name);
      }

      const getIpFilter = filterModel.getCondition('ip');
      if (getIpFilter) {
        dataList = dataList.filter((v) => v.ip === getIpFilter.ip);
      }
    }

    if (filterModel.getLengthOfSortBy() > 0) {
      const getNameSort = filterModel.getSortBy('name');
      if (getNameSort) {
        dataList = sortListObject<IpInterfaceModel>(dataList, getNameSort, 'name');
      }

      const getIpSort = filterModel.getSortBy('ip');
      if (getIpSort) {
        dataList = sortListObject<IpInterfaceModel>(dataList, getIpSort, 'ip');
      }
    }

    if (!filterModel.skipPagination) {
      const pageNumber = filterModel.page;
      const pageSize = filterModel.limit;
      const resultPagination = dataList.slice((pageNumber - 1) * pageSize, pageNumber * pageSize);

      return [resultPagination, dataList.length];
    }

    return [dataList, dataList.length];
  }
}
