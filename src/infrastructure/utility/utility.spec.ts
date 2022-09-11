import {sortListObject} from '@src-infrastructure/utility/utility';
import {SortEnum} from '@src-core/model/filter.model';

type sampleTestObject = { id: number, name: string };

describe('utility', () => {
  describe(`sortListObject`, () => {
    let recordData1: sampleTestObject;
    let recordData2: sampleTestObject;

    beforeEach(() => {
      recordData1 = {id: 1, name: 'Z'};
      recordData2 = {id: 2, name: 'A'};
    });

    it(`Should successfully sort by id ASC`, () => {
      const result = sortListObject<sampleTestObject>([recordData1, recordData2], SortEnum.ASC, 'id');

      expect(result[0]).toMatchObject(<sampleTestObject>{id: recordData1.id, name: recordData1.name});
      expect(result[1]).toMatchObject(<sampleTestObject>{id: recordData2.id, name: recordData2.name});
    });

    it(`Should successfully sort by id DESC`, () => {
      const result = sortListObject<sampleTestObject>([recordData1, recordData2], SortEnum.DESC, 'id');

      expect(result[0]).toMatchObject(<sampleTestObject>{id: recordData2.id, name: recordData2.name});
      expect(result[1]).toMatchObject(<sampleTestObject>{id: recordData1.id, name: recordData1.name});
    });

    it(`Should successfully sort by name ASC`, () => {
      const result = sortListObject<sampleTestObject>([recordData1, recordData2], SortEnum.ASC, 'name');

      expect(result[0]).toMatchObject(<sampleTestObject>{id: recordData2.id, name: recordData2.name});
      expect(result[1]).toMatchObject(<sampleTestObject>{id: recordData1.id, name: recordData1.name});
    });

    it(`Should successfully sort by name DESC`, () => {
      const result = sortListObject<sampleTestObject>([recordData1, recordData2], SortEnum.DESC, 'name');

      expect(result[0]).toMatchObject(<sampleTestObject>{id: recordData1.id, name: recordData1.name});
      expect(result[1]).toMatchObject(<sampleTestObject>{id: recordData2.id, name: recordData2.name});
    });
  });
});
