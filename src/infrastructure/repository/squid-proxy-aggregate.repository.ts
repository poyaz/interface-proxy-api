import {IProxyRepositoryInterface} from '@src-core/interface/i-proxy-repository.interface';
import {ProxyDownstreamModel, ProxyInstanceModel, ProxyUpstreamModel} from '@src-core/model/proxy.model';
import {AsyncReturn} from '@src-utility-type';
import {FilterModel} from '@src-core/model/filter.model';
import {IRunnerRepositoryInterface} from '@src-core/interface/i-runner-repository.interface';
import * as path from 'path';
import {spawn} from 'child_process';
import {RepositoryException} from '@src-core/exception/repository.exception';
import {NotFoundException} from '@src-core/exception/not-found.exception';
import fsAsync from 'fs/promises';
import {RunnerModel} from '@src-core/model/runner.model';

export class SquidProxyAggregateRepository implements IProxyRepositoryInterface {
  private readonly _configPath: string;

  constructor(
    configPath: string,
    private readonly _dockerRunnerRepository: IRunnerRepositoryInterface,
    private readonly _squidProxyRepository: IProxyRepositoryInterface,
  ) {
    this._configPath = path.resolve(configPath);
  }

  async getAllDownstream(filterModel?: FilterModel<ProxyDownstreamModel>): Promise<AsyncReturn<Error, Array<ProxyDownstreamModel>>> {
    return this._squidProxyRepository.getAllDownstream(filterModel);
  }

  async getAllUpstream(filterModel?: FilterModel<ProxyUpstreamModel>): Promise<AsyncReturn<Error, Array<ProxyUpstreamModel>>> {
    const [
      [proxyUpstreamError, proxyUpstreamData, proxyUpstreamTotalCount],
      [runnerError, runnerData, runnerTotalCount],
      [findError, findData],
    ] = await Promise.all([
      this._squidProxyRepository.getAllUpstream(),
      this._dockerRunnerRepository.getAll(),
      this._findFileUpstreamInfo(),
    ]);
    if (proxyUpstreamError) {
      return [proxyUpstreamError];
    }
    if (runnerError) {
      return [runnerError];
    }
    if (findError) {
      return [findError];
    }
    if (proxyUpstreamTotalCount === 0 || runnerTotalCount === 0 || findData.length === 0) {
      return [null, [], 0];
    }

    const result = SquidProxyAggregateRepository._joinProxyUpstreamAndRunner(proxyUpstreamData, runnerData, findData);

    return [null, result, result.length];
  }

  async create(model: ProxyUpstreamModel): Promise<AsyncReturn<Error, ProxyUpstreamModel>> {
    return Promise.resolve(undefined);
  }

  async remove(id: string): Promise<AsyncReturn<Error, null>> {
    return Promise.resolve(undefined);
  }

  private async _findFileUpstreamInfo(): Promise<AsyncReturn<Error, Array<string>>> {
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
          '-oP',
          '-w',
          '^###\\s+upstream-id:\\s+\\K(.+)',
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
        .filter((v) => v.trim() !== '');

      return [null, dataList, dataList.length];
    } catch (error) {
      return [new RepositoryException(error)];
    }
  }

  private static _joinProxyUpstreamAndRunner(
    proxyUpstreamModelList: Array<ProxyUpstreamModel>,
    runnerModelList: Array<RunnerModel<ProxyInstanceModel>>,
    upstreamPathList: Array<string>,
  ): Array<ProxyUpstreamModel> {
    return proxyUpstreamModelList
      .map((proxyUpstreamModel) => {
        const findUpstreamPath = upstreamPathList.find((v) => (v.match(/^.+:([^:]+)$/) || [null, ''])[1] === proxyUpstreamModel.id);
        if (!findUpstreamPath) {
          return proxyUpstreamModel;
        }

        const [, configPath] = /^(.+):[^:]+$/.exec(findUpstreamPath);
        const parentDirPath = path.dirname(configPath);

        const findRunner = runnerModelList.find((p) =>
          p.volumes.find((c) => c.source === parentDirPath || c.source === path.join(parentDirPath, path.sep)),
        );
        if (!findRunner) {
          return proxyUpstreamModel;
        }

        proxyUpstreamModel.runner = findRunner;

        return proxyUpstreamModel;
      })
      .filter((v) => <keyof ProxyUpstreamModel>'runner' in v);
  }
}
