import {ProxyDownstreamModel, ProxyUpstreamModel} from '@src-core/model/proxy.model';
import {AsyncReturn} from '@src-utility-type';
import {FilterModel} from '@src-core/model/filter.model';

export interface IProxyRepositoryInterface {
  getAllDownstream(filterModel?: FilterModel<ProxyDownstreamModel>): Promise<AsyncReturn<Error, Array<ProxyDownstreamModel>>>;

  getAllUpstream(filterModel?: FilterModel<ProxyUpstreamModel>): Promise<AsyncReturn<Error, Array<ProxyUpstreamModel>>>;

  create(model: ProxyUpstreamModel): Promise<AsyncReturn<Error, ProxyUpstreamModel>>;

  remove(id: string): Promise<AsyncReturn<Error, null>>;
}
