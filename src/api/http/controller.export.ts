import {InterfaceHttpController} from '@src-api/http/controller/interface/interface.http.controller';
import {ProxyHttpController} from '@src-api/http/controller/proxy/proxy.http.controller';
import {JobHttpController} from '@src-api/http/controller/job/job.http.controller';

export const controllersExport = [
  InterfaceHttpController,
  ProxyHttpController,
  JobHttpController,
];
