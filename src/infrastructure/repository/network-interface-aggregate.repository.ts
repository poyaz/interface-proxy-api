import {INetworkInterfaceRepositoryInterface} from '@src-core/interface/i-network-interface-repository.interface';
import {FilterModel} from '@src-core/model/filter.model';
import {IpInterfaceModel} from '@src-core/model/ip-interface.model';
import {AsyncReturn} from '@src-utility-type';
import {ISystemInfoRepositoryInterface} from '@src-core/interface/i-system-info-repository.interface';
import {filterAndSortIpInterface} from '@src-infrastructure/utility/filterAndSortIpInterface';

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
      [squidIpError, squidIpList],
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

    return [null, ...filterAndSortIpInterface(ipList, filterModel)];
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
}
