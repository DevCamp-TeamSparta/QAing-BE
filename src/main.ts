import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'https://app.qaing.co',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  app.use(cookieParser());

  await app.listen(8080, () =>
    setInterval(
      // 테스트 커밋
      () => console.log('Production : Nest.JS Server started on 8080'),
      5000,
    ),
  );
}
bootstrap();
