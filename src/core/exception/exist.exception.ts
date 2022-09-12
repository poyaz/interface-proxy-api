import {ExceptionEnum} from '@src-core/enum/exception.enum';

export class ExistException<T> extends Error {
  readonly isOperation: boolean;
  readonly existProperties: Array<keyof T>;

  constructor(properties?: Array<keyof T>) {
    super('Your object already exists!');

    this.name = ExceptionEnum.EXIST_ERROR;
    this.isOperation = true;
    this.existProperties = properties || [];
  }
}
