import {ModelRequireProp} from '@src-utility-type';

export class IpInterfaceModel {
  id: string;
  name: string;
  ip: string;
  isUse: boolean;

  constructor(props: ModelRequireProp<typeof IpInterfaceModel.prototype>) {
    Object.assign(this, props);
  }

  clone() {
    return Object.assign(Object.create(this), this);
  }
}
