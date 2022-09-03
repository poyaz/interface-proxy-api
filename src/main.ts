import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import {ConfigService} from '@nestjs/config';
import {ValidationPipe, VersioningType} from '@nestjs/common';
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger';
import {ServerConfigInterface} from '@src-loader/configure/interface/server-config.interface';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const SERVER_OPTIONS = configService.get<ServerConfigInterface>('server');

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
  });
  app.useGlobalPipes(new ValidationPipe({
    errorHttpStatusCode: 422,
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));
  app.enableCors({origin: '*'});

  const swaggerConf = new DocumentBuilder()
    .setTitle('Interface proxy api')
    .setDescription('The proxy API description')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConf);
  SwaggerModule.setup('api', app, document);

  await app.listen(SERVER_OPTIONS.http.port, SERVER_OPTIONS.host);
}

bootstrap().catch((error) => {
  console.log(error);
  process.exit(1);
});
