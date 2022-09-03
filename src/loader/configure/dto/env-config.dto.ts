import {IsEnum, IsNumber, IsOptional, IsString} from 'class-validator';
import {EnvironmentEnv} from '@src-loader/configure/enum/environment.env';
import {BooleanEnv} from '@src-loader/configure/enum/boolean.env';
import {Transform} from 'class-transformer';

export class EnvConfigDto {
  @IsOptional()
  @IsString()
  TZ?: string;

  @IsOptional()
  @IsEnum(EnvironmentEnv)
  @Transform(param => param.value.toLowerCase())
  NODE_ENV?: EnvironmentEnv;

  @IsOptional()
  @IsString()
  SERVER_HOST?: string;

  @IsOptional()
  @IsNumber()
  SERVER_HTTP_PORT?: number;

  @IsOptional()
  @IsNumber()
  SERVER_HTTPS_PORT?: number;

  @IsOptional()
  @IsEnum(BooleanEnv)
  @Transform(param => param.value.toLowerCase())
  SERVER_HTTPS_FORCE?: BooleanEnv;
}


