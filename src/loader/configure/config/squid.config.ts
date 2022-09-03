import {registerAs} from '@nestjs/config';
import {SquidConfigInterface} from '@src-loader/configure/interface/squid-config.interface';

export default registerAs('squid', (): SquidConfigInterface => {
  return {};
});
