import {RunnerModel} from '@src-core/model/runner.model';
import {ModelRequireProp} from '@src-utility-type';

export enum ProxyTypeEnum {
  INTERFACE,
}

export enum ProxyStatusEnum {
  DISABLE,
  OFFLINE,
  ONLINE,
}

export class ProxyDownstreamModel {
  id: string;
  refId: string;
  ip: string;
  mask: number;
  type: ProxyTypeEnum;
  runner?: RunnerModel;
  status: ProxyStatusEnum;

  constructor(props: ModelRequireProp<typeof ProxyDownstreamModel.prototype>) {
    Object.assign(this, props);
  }

  clone() {
    return Object.assign(Object.create(this), this);
  }
}

export class ProxyUpstreamModel {
  id: string;
  listenIp: string;
  listenPort: number;
  proxyDownstream: Array<ProxyDownstreamModel>;
  runner?: RunnerModel;

  constructor(props: ModelRequireProp<typeof ProxyUpstreamModel.prototype>) {
    Object.assign(this, props);
  }

  clone(): ProxyUpstreamModel {
    return Object.assign(Object.create(this), this);
  }
}
