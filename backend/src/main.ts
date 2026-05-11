import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 전역 ValidationPipe (DTO 자동 검증)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // CORS (프론트엔드 연동)
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  });

  // 전역 API prefix
  app.setGlobalPrefix('api');

  // Swagger / OpenAPI 문서
  const swaggerConfig = new DocumentBuilder()
    .setTitle('CodeXray API')
    .setDescription(
      '프로그래머스 풀이 트래커 + 커스텀 티어 + AI 분석 + 커뮤니티 + 알림 시스템\n\n' +
        '인증이 필요한 엔드포인트는 우측 상단의 **Authorize** 버튼으로 JWT 를 등록한 뒤 호출하세요.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: '로그인 응답의 accessToken 값을 입력 (Bearer 자동 부착)',
      },
      'jwt',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-Admin-Key',
        in: 'header',
        description: '데이터 관리 CLI 용 관리자 키 (.env 의 ADMIN_KEY)',
      },
      'adminKey',
    )
    .addTag('Auth', '회원가입 / 로그인 / OAuth / 이메일 인증')
    .addTag('Users', '내 프로필 / 공개 프로필 / 비밀번호 변경 / 회원 탈퇴')
    .addTag('Problems', '프로그래머스 문제 목록 / 상세')
    .addTag('Solutions', '내 풀이 등록 / 메모')
    .addTag('Notes', '개인 노트 (코드 / 패턴 / 오답)')
    .addTag('Bookmarks', '문제 북마크')
    .addTag('Tags', '알고리즘 태그 목록')
    .addTag('Ratings', '난이도 피드백 / 티어 재계산')
    .addTag('Community', '커뮤니티 글 / 댓글 / 추천 / 신고')
    .addTag('Notifications', '인앱 알림')
    .addTag('AI', 'Claude 기반 풀이 분석')
    .addTag('Admin', '관리자 전용 (X-Admin-Key 또는 JWT role=ADMIN)')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}/api`);
  console.log(`Swagger docs at  http://localhost:${port}/api-docs`);
}
bootstrap();
