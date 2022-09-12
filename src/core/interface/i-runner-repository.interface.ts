import {AsyncReturn} from '@src-utility-type';
import {RunnerModel} from '@src-core/model/runner.model';
import {FilterModel} from '@src-core/model/filter.model';

export interface IRunnerRepositoryInterface {
  getAll<T = string>(filter?: FilterModel<RunnerModel<T>>): Promise<AsyncReturn<Error, Array<RunnerModel<T>>>>;

  create<T = string>(model: RunnerModel<T>): Promise<AsyncReturn<Error, RunnerModel<T>>>;

  restart(id: string): Promise<AsyncReturn<Error, null>>;

  reload(id: string): Promise<AsyncReturn<Error, null>>;

  remove(id: string): Promise<AsyncReturn<Error, null>>;
}
