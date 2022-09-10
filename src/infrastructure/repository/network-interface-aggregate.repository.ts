import {INetworkInterfaceRepositoryInterface} from '@src-core/interface/i-network-interface-repository.interface';
import {FilterModel} from '@src-core/model/filter.model';
import {IpInterfaceModel} from '@src-core/model/ip-interface.model';
import {AsyncReturn} from '@src-utility-type';
import {ISystemInfoRepositoryInterface} from '@src-core/interface/i-system-info-repository.interface';
import {sortListObject} from '@src-infrastructure/utility';

export class NetworkInterfaceAggregateRepository implements INetworkInterfaceRepositoryInterface {
  constructor(
    private readonly _systemInfoRepository: ISystemInfoRepositoryInterface,
    private readonly _networkInterfaceRepository: INetworkInterfaceRepositoryInterface,
  ) {
  }

  async getAll(filter?: FilterModel<IpInterfaceModel>): Promise<AsyncReturn<Error, Array<IpInterfaceModel>>> {
    const filterModel = filter instanceof FilterModel
      ? filter
      : new FilterModel<IpInterfaceModel>();

    const networkIpFilter = new FilterModel<IpInterfaceModel>({skipPagination: true});
    const squidIpFilter = new FilterModel<IpInterfaceModel>({skipPagination: true});

    const conditionList = filterModel.getConditionList();
    for (const condition of conditionList) {
      if (<keyof IpInterfaceModel>'isUse' in condition) {
        continue;
      }

      networkIpFilter.addCondition(condition);
      squidIpFilter.addCondition(condition);
    }

    const [
      [networkIpError, networkIpList, networkIpTotalCount],
      [squidIpError, squidIpList, squidIpTotalCount],
    ] = await Promise.all([
      this._systemInfoRepository.getAllNetworkInterface(networkIpFilter),
      this._networkInterfaceRepository.getAll(squidIpFilter),
    ]);
    if (networkIpError) {
      return [networkIpError];
    }
    if (squidIpError) {
      return [squidIpError];
    }
    if (networkIpTotalCount === 0) {
      return [null, [], 0];
    }

    const ipList = networkIpList.map((v) => NetworkInterfaceAggregateRepository._joinData(v, squidIpList));

    return [null, ...NetworkInterfaceAggregateRepository._paginationAndFilterData(ipList, filterModel)];
  }

  private static _joinData(networkIp: IpInterfaceModel, squidIpList: Array<IpInterfaceModel>): IpInterfaceModel | null {
    const findSquidIp = squidIpList.find((v) => v.ip === networkIp.ip);
    if (!findSquidIp) {
      return networkIp;
    }

    const data = networkIp.clone();
    data.isUse = true;

    return data;
  }

  private static _paginationAndFilterData(ipList: Array<IpInterfaceModel>, filterModel: FilterModel<IpInterfaceModel>): [Array<IpInterfaceModel>, number] {
    let dataList = ipList;

    if (filterModel.getLengthOfCondition() > 0) {
      const getIsUseFilter = filterModel.getCondition('isUse');
      if (getIsUseFilter) {
        dataList = dataList.filter((v) => v.isUse === getIsUseFilter.isUse);
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
