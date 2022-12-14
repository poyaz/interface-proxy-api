import {INetworkInterfaceRepositoryInterface} from '@src-core/interface/i-network-interface-repository.interface';
import {FilterModel} from '@src-core/model/filter.model';
import {AsyncReturn} from '@src-utility-type';
import {IpInterfaceModel} from '@src-core/model/ip-interface.model';
import {spawn} from 'child_process';
import {resolve} from 'path';
import {RepositoryException} from '@src-core/exception/repository.exception';
import {defaultModelFactory} from '@src-core/model/defaultModel';
import {sortListObject} from '@src-infrastructure/utility/utility';
import {filterAndSortIpInterface} from '@src-infrastructure/utility/filterAndSortIpInterface';

export class SquidNetworkInterfaceRepository implements INetworkInterfaceRepositoryInterface {
  private readonly _configPath: string;

  constructor(configPath: string) {
    this._configPath = resolve(configPath);
  }

  async getAll(filter?: FilterModel<IpInterfaceModel>): Promise<AsyncReturn<Error, Array<IpInterfaceModel>>> {
    const filterModel = filter instanceof FilterModel
      ? <FilterModel<IpInterfaceModel>><any>filter
      : new FilterModel<IpInterfaceModel>();

    try {
      const exec = spawn(
        'find',
        [
          this._configPath,
          '-type',
          'f',
          '-name',
          '*.conf',
          '-exec',
          'sed',
          '-rn',
          's/^tcp_outgoing_address\\s+([^\\s]+)\\s+.+$/\\1/p',
          '{}',
          '+',
        ],
      );

      let executeError = '';
      for await (const chunk of exec.stderr) {
        executeError += chunk;
      }
      if (executeError) {
        return [new RepositoryException(new Error(executeError))];
      }

      let executeData = '';
      for await (const chunk of exec.stdout) {
        executeData += chunk;
      }
      const allIpList = executeData
        .split('\n')
        .filter((v) => v !== '')
        .map((v) => SquidNetworkInterfaceRepository._fillModel(v));

      if (allIpList.length === 0) {
        return [null, [], 0];
      }

      return [null, ...filterAndSortIpInterface(allIpList, filterModel)];
    } catch (error) {
      return [new RepositoryException(error)];
    }
  }

  private static _fillModel(ip) {
    const model = new IpInterfaceModel({
      id: 'default-id',
      name: 'default-name',
      ip: ip,
      isUse: false,
    });

    return defaultModelFactory(IpInterfaceModel, model, ['id', 'name', 'isUse']);
  }
}
