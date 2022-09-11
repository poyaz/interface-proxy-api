import {SortEnum} from '@src-core/model/filter.model';
import fsAsync from 'fs/promises';
import path from 'path';

export function sortListObject<T>(dataList: Array<T>, sortType: SortEnum, prop: keyof T) {
  const sortTypeNum = sortType === SortEnum.ASC ? 1 : -1;

  return dataList.sort((a, b) => {
    if (a[prop] > b[prop]) {
      return sortTypeNum * 1;
    }
    if (a[prop] < b[prop]) {
      return sortTypeNum * -1;
    }

    return 0;
  });
}

export async function* getFiles(dirPath) {
  const dirList = await fsAsync.readdir(dirPath, {withFileTypes: true});
  for (const dir of dirList) {
    const res = path.resolve(dirPath, dir.name);
    if (dir.isDirectory()) {
      yield* getFiles(res);
    } else {
      yield res;
    }
  }
}
