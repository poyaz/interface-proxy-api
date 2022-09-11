import {ExceptionEnum} from '@src-core/enum/exception.enum';

export class InvalidConfigFileException extends Error {
  readonly isOperation: boolean;
  readonly additionalInfo: Array<string> = [];

  constructor(files: Array<string>) {
    super('Invalid config file!');

    this.name = ExceptionEnum.FILL_DATA_REPOSITORY_ERROR;
    this.isOperation = false;

    this.additionalInfo.push(...files);
  }
}
