import {getFiles, sortListObject} from '@src-infrastructure/utility/utility';
import {SortEnum} from '@src-core/model/filter.model';
import * as path from 'path';
import {Dirent} from 'fs';
import * as fsAsync from 'fs/promises';

jest.mock('fs/promises');

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

  describe(`getFiles`, () => {
    let dirPath: string;
    let dirListFirstLevel1: Dirent;
    let dirListFirstLevel1File1: Dirent;
    let dirListFirstLevel1FileFile2: Dirent;
    let dirListFirstLevel2: Dirent;
    let dirListFirstLevel2File1: Dirent;

    beforeEach(() => {
      dirPath = '/dir/of/scan';

      dirListFirstLevel1 = new Dirent();
      dirListFirstLevel1.name = 'f1';
      dirListFirstLevel1.isDirectory = jest.fn().mockReturnValue(true);

      dirListFirstLevel1File1 = new Dirent();
      dirListFirstLevel1File1.name = 'file1.txt';
      dirListFirstLevel1File1.isDirectory = jest.fn().mockReturnValue(false);

      dirListFirstLevel1FileFile2 = new Dirent();
      dirListFirstLevel1FileFile2.name = 'file1.conf';
      dirListFirstLevel1FileFile2.isDirectory = jest.fn().mockReturnValue(false);

      dirListFirstLevel2 = new Dirent();
      dirListFirstLevel2.name = 'f2';
      dirListFirstLevel2.isDirectory = jest.fn().mockReturnValue(true);

      dirListFirstLevel2File1 = new Dirent();
      dirListFirstLevel2File1.name = 'file2.json';
      dirListFirstLevel2File1.isDirectory = jest.fn().mockReturnValue(false);
    });

    afterEach(() => {
      jest.restoreAllMocks();
      jest.resetAllMocks();
    });

    it(`Should error get all files when execute fs read dir`, async () => {
      const fileError = new Error('File error');
      (<jest.Mock>fsAsync.readdir).mockRejectedValue(fileError);
      let error;

      try {
        const fileList = getFiles(dirPath);
        await fileList.next();
      } catch (e) {
        error = e;
      }

      expect(fsAsync.readdir).toHaveBeenCalled();
      expect((<jest.Mock>fsAsync.readdir).mock.calls[0][0]).toEqual(dirPath);
      expect(error).toBeInstanceOf(Error);
    });

    it(`Should successfully get all files`, async () => {
      (<jest.Mock>fsAsync.readdir)
        .mockResolvedValueOnce([dirListFirstLevel1, dirListFirstLevel2])
        .mockResolvedValueOnce([dirListFirstLevel1File1, dirListFirstLevel1FileFile2])
        .mockResolvedValueOnce([dirListFirstLevel2File1]);
      let result = [];
      let error;

      try {
        const fileList = getFiles(dirPath);
        for await (const file of fileList) {
          result.push(file);
        }
      } catch (e) {
        error = e;
      }

      expect(fsAsync.readdir).toBeCalledTimes(3);
      expect((<jest.Mock>fsAsync.readdir).mock.calls[0][0]).toEqual(dirPath);
      expect((<jest.Mock>fsAsync.readdir).mock.calls[1][0]).toEqual(path.resolve(dirPath, dirListFirstLevel1.name));
      expect((<jest.Mock>fsAsync.readdir).mock.calls[2][0]).toEqual(path.resolve(dirPath, dirListFirstLevel2.name));
      expect(error).toBeUndefined();
      expect(result).toEqual(expect.arrayContaining([
        path.resolve(dirPath, dirListFirstLevel1.name, dirListFirstLevel1File1.name),
        path.resolve(dirPath, dirListFirstLevel1.name, dirListFirstLevel1FileFile2.name),
        path.resolve(dirPath, dirListFirstLevel2.name, dirListFirstLevel2File1.name),
      ]));
    });
  });
});
