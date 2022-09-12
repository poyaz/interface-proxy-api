import {IProxyRepositoryInterface} from '@src-core/interface/i-proxy-repository.interface';
import {ProxyDownstreamModel, ProxyUpstreamModel} from '@src-core/model/proxy.model';
import {AsyncReturn} from '@src-utility-type';
import {FilterModel} from '@src-core/model/filter.model';
import {IRunnerRepositoryInterface} from '@src-core/interface/i-runner-repository.interface';

export class SquidProxyAggregateRepository implements IProxyRepositoryInterface {
  constructor(
    private readonly _dockerRunnerRepository: IRunnerRepositoryInterface,
    private readonly _squidProxyRepository: IProxyRepositoryInterface,
  ) {
  }

  async getAllDownstream(filterModel?: FilterModel<ProxyDownstreamModel>): Promise<AsyncReturn<Error, Array<ProxyDownstreamModel>>> {
    return this._squidProxyRepository.getAllDownstream(filterModel);
  }

  async getAllUpstream(filterModel?: FilterModel<ProxyUpstreamModel>): Promise<AsyncReturn<Error, Array<ProxyUpstreamModel>>> {
    return Promise.resolve(undefined);
  }

  async create(model: ProxyUpstreamModel): Promise<AsyncReturn<Error, ProxyUpstreamModel>> {
    return Promise.resolve(undefined);
  }

  async remove(id: string): Promise<AsyncReturn<Error, null>> {
    return Promise.resolve(undefined);
  }
}
