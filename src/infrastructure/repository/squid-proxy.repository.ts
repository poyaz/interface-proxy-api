import {IProxyRepositoryInterface} from '@src-core/interface/i-proxy-repository.interface';
import {FilterModel} from '@src-core/model/filter.model';
import {ProxyDownstreamModel, ProxyStatusEnum, ProxyTypeEnum, ProxyUpstreamModel} from '@src-core/model/proxy.model';
import {AsyncReturn, ClassConstructor} from '@src-utility-type';
import {resolve} from 'path';
import * as fsAsync from 'fs/promises';
import {getFiles} from '@src-infrastructure/utility/utility';
import {RepositoryException} from '@src-core/exception/repository.exception';
import {DefaultModel, defaultModelFactory} from '@src-core/model/defaultModel';
import {FillDataRepositoryException} from '@src-core/exception/fill-data-repository.exception';
import {InvalidConfigFileException} from '@src-core/exception/invalid-config-file.exception';

export class SquidProxyRepository implements IProxyRepositoryInterface {
  private readonly _configPath: string;

  constructor(configPath: string) {
    this._configPath = resolve(configPath);
  }

  async getAllDownstream(filterModel?: FilterModel<ProxyDownstreamModel>): Promise<AsyncReturn<Error, Array<ProxyDownstreamModel>>> {
    const result: Array<ProxyDownstreamModel> = [];

    try {
      const fileList = getFiles(this._configPath);
      for await (const file of fileList) {
        if (!/\.conf$/.exec(file)) {
          continue;
        }

        const data = await fsAsync.readFile(file, 'utf-8');
        result.push(SquidProxyRepository._validateAndFillProxyModel<ProxyDownstreamModel>(ProxyDownstreamModel, file, data));
      }

      if (result.length === 0) {
        return [null, [], 0];
      }

      return [null, result, result.length];
    } catch (error) {
      if (error instanceof InvalidConfigFileException || error instanceof FillDataRepositoryException) {
        return [error];
      }

      return [new RepositoryException(error)];
    }
  }

  async getAllUpstream(filterModel?: FilterModel<ProxyUpstreamModel>): Promise<AsyncReturn<Error, Array<ProxyUpstreamModel>>> {
    const result: Array<ProxyUpstreamModel> = [];

    try {
      const fileList = getFiles(this._configPath);
      for await (const file of fileList) {
        if (!/\.conf$/.exec(file)) {
          continue;
        }

        const data = await fsAsync.readFile(file, 'utf-8');
        result.push(SquidProxyRepository._validateAndFillProxyModel<ProxyUpstreamModel>(ProxyUpstreamModel, file, data));
      }

      if (result.length === 0) {
        return [null, [], 0];
      }

      return [null, result, result.length];
    } catch (error) {
      if (error instanceof InvalidConfigFileException || error instanceof FillDataRepositoryException) {
        return [error];
      }

      return [new RepositoryException(error)];
    }
  }

  create(model: ProxyUpstreamModel): Promise<AsyncReturn<Error, ProxyUpstreamModel>> {
    return Promise.resolve(undefined);
  }

  remove(id: string): Promise<AsyncReturn<Error, null>> {
    return Promise.resolve(undefined);
  }

  private static _validateAndFillProxyModel<T>(cls: ClassConstructor<T>, filePath: string, content: string): T {
    const downstreamModel = SquidProxyRepository._fillDownstreamModel(content);
    const upstreamModel = SquidProxyRepository._fillUpstreamModel(content, [downstreamModel]);

    if (cls.name === ProxyUpstreamModel.name) {
      const defaultProperties = (<DefaultModel<ProxyUpstreamModel>><any>upstreamModel).getDefaultProperties();
      if (defaultProperties.length !== 0) {
        throw new FillDataRepositoryException<ProxyUpstreamModel>(defaultProperties);
      }

      return <T>upstreamModel;
    }
    if (cls.name === ProxyDownstreamModel.name) {
      const matchUpstreamId = content.match(/^###\s+upstream-id:\s+(.+)/m);
      if (!matchUpstreamId) {
        throw new InvalidConfigFileException([filePath]);
      }

      const defaultProperties = (<DefaultModel<ProxyDownstreamModel>><any>downstreamModel).getDefaultProperties();
      if (defaultProperties.length !== 0) {
        throw new FillDataRepositoryException<ProxyDownstreamModel>(defaultProperties);
      }

      return <T>downstreamModel;
    }

    throw TypeError(`Not match type`);
  }

  private static _fillDownstreamModel(content: string): ProxyDownstreamModel {
    const downstreamModel = defaultModelFactory(
      ProxyDownstreamModel,
      {
        id: 'default-id',
        refId: 'default-refId',
        ip: 'default-ip',
        mask: 32,
        type: ProxyTypeEnum.INTERFACE,
        status: ProxyStatusEnum.ONLINE,
      },
      ['id', 'refId', 'ip'],
    );

    const matchDownstreamId = content.match(/^###\s+downstream-id:\s+(.+)/m);
    if (matchDownstreamId && matchDownstreamId.length > 0) {
      downstreamModel.id = matchDownstreamId[1];
    }

    const matchRefId = content.match(/^###\s+ref-id:\s+(.+)/m);
    if (matchRefId && matchRefId.length > 0) {
      downstreamModel.refId = matchRefId[1];
    }

    const matchInterfaceIp = content.match(/^tcp_outgoing_address\s+([^\s]+)\s+.+/m);
    if (matchInterfaceIp && matchInterfaceIp.length > 0) {
      downstreamModel.ip = matchInterfaceIp[1];
    }

    return downstreamModel;
  }

  private static _fillUpstreamModel(content: string, downstreamModelList: Array<ProxyDownstreamModel>): ProxyUpstreamModel {
    const upstreamModel = defaultModelFactory(
      ProxyUpstreamModel,
      {
        id: 'default-id',
        listenIp: 'default-listenIp',
        listenPort: 0,
        proxyDownstream: downstreamModelList,
      },
      ['id', 'listenIp', 'listenPort'],
    );

    const matchUpstreamId = content.match(/^###\s+upstream-id:\s+(.+)/m);
    if (matchUpstreamId && matchUpstreamId.length > 0) {
      upstreamModel.id = matchUpstreamId[1];
    }

    const matchListenPort = content.match(/^http_port\s+([^\s]+):([0-9]+)\s+.+/m);
    if (matchListenPort && matchListenPort.length > 0) {
      upstreamModel.listenIp = matchListenPort[1];
      upstreamModel.listenPort = Number(matchListenPort[2]);
    }

    return upstreamModel;
  }
}
