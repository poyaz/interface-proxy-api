import {IProxyRepositoryInterface} from '@src-core/interface/i-proxy-repository.interface';
import {FilterModel} from '@src-core/model/filter.model';
import {ProxyDownstreamModel, ProxyStatusEnum, ProxyTypeEnum, ProxyUpstreamModel} from '@src-core/model/proxy.model';
import {AsyncReturn, ClassConstructor} from '@src-utility-type';
import * as path from 'path';
import * as fsAsync from 'fs/promises';
import {checkDirOrFileExist, getFiles} from '@src-infrastructure/utility/utility';
import {RepositoryException} from '@src-core/exception/repository.exception';
import {DefaultModel, defaultModelFactory} from '@src-core/model/defaultModel';
import {FillDataRepositoryException} from '@src-core/exception/fill-data-repository.exception';
import {InvalidConfigFileException} from '@src-core/exception/invalid-config-file.exception';
import {RunnerModel} from '@src-core/model/runner.model';
import {ExistException} from '@src-core/exception/exist.exception';
import {IIdentifier} from '@src-core/interface/i-identifier.interface';
import {spawn} from 'child_process';
import {NotFoundException} from '@src-core/exception/not-found.exception';

export class SquidProxyRepository implements IProxyRepositoryInterface {
  private readonly _configPath: string;

  constructor(configPath: string, private readonly _identifier: IIdentifier) {
    this._configPath = path.resolve(configPath);
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

  async create(model: ProxyUpstreamModel): Promise<AsyncReturn<Error, ProxyUpstreamModel>> {
    if (!(<keyof ProxyUpstreamModel>'runner' in model)) {
      return [new FillDataRepositoryException<ProxyUpstreamModel>(['runner'])];
    }

    const findConfigVolume = model.runner.volumes.find((v) => v.dest === '/etc/squid/conf.d/' || v.dest === '/etc/squid/conf.d');
    if (!findConfigVolume) {
      return [new FillDataRepositoryException<RunnerModel>(['volumes'])];
    }

    const configFile = path.join(findConfigVolume.source, `port_${model.listenPort}.conf`);

    try {
      const checkFileExistData = await checkDirOrFileExist(configFile);
      if (checkFileExistData) {
        return [new ExistException<RunnerModel>(['volumes'])];
      }

      const outputModel = model.clone();
      outputModel.id = this._identifier.generateId();
      outputModel.proxyDownstream[0].id = this._identifier.generateId();

      const configFileData = [
        `### upstream-id: ${outputModel.id}`,
        `http_port ${outputModel.listenIp}:${outputModel.listenPort} name=port${outputModel.listenPort}`,
        '',
        `acl out${outputModel.listenPort} myportname port${outputModel.listenPort}`,
        '',
        `### downstream-id: ${outputModel.proxyDownstream[0].id}`,
        `### ref-id: ${outputModel.proxyDownstream[0].refId}`,
        `tcp_outgoing_address ${outputModel.proxyDownstream[0].ip} out${outputModel.listenPort}`,
      ];

      await fsAsync.writeFile(configFile, configFileData.join('\n'), {encoding: 'utf-8', flag: 'w'});

      return [null, outputModel];
    } catch (error) {
      return [new RepositoryException(error)];
    }
  }

  async remove(id: string): Promise<AsyncReturn<Error, null>> {
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
          'grep',
          '-E',
          '-w',
          `^###\\s+upstream-id:\\s+${id}`,
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

      const dataList = executeData
        .split('\n')
        .filter((v) => v.trim() !== '')
        .map((v) => (v.match(/^(.+\.conf):###.+/) || [null, null])[1])
        .filter((v) => v);

      if (dataList.length === 0) {
        return [new NotFoundException()];
      }

      await fsAsync.unlink(dataList[0]);

      return [null, null];
    } catch (error) {
      return [new RepositoryException(error)];
    }
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
