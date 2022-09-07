import {SortEnum} from '@src-core/model/filter.model';

export function sortListObject<T>(dataList: Array<T>, sortType: SortEnum, prop: keyof T) {
  return dataList.sort((a, b) => {
    let d1;
    let d2;
    if (sortType === SortEnum.ASC) {
      d1 = a;
      d2 = b;
    }
    if (sortType === SortEnum.DESC) {
      d1 = b;
      d2 = a;
    }

    if (d1[prop] > d2[prop]) {
      return 1;
    }
    if (d1[prop] < d2[prop]) {
      return -1;
    }

    return 0;
  });
}
