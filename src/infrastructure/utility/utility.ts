import {SortEnum} from '@src-core/model/filter.model';
import * as fsAsync from 'fs/promises';
import * as path from 'path';
import * as fs from 'fs';

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

export async function* getFiles(dirPath): AsyncGenerator<string> {
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

export async function checkFileExist(filePath): Promise<boolean> {
  try {
    await fsAsync.access(filePath, fs.constants.F_OK | fs.constants.R_OK);

    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
}
