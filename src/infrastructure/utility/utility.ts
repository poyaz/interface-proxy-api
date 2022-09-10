import {SortEnum} from '@src-core/model/filter.model';

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
