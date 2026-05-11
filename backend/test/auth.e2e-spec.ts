import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { MailService } from '../src/mail/mail.service';

const TEST_EMAIL = 'e2e-auth-test@codexray.test';
const TEST_NICK = `e2e_${Date.now()}`;
const TEST_PASSWORD = 'longpass1';

describe('Auth flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: any;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue({ sendVerificationEmail: jest.fn() })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.setGlobalPrefix('api');
    await app.init();

    prisma = module.get(PrismaService);
    server = app.getHttpServer();

    // 이전 테스트 잔여 정리
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
    await app.close();
  });

  it('회원가입 → 미인증 로그인 차단 → 인증 → 로그인 성공 (4단계 흐름)', async () => {
    // 1. 회원가입
    const registerRes = await request(server)
      .post('/api/auth/register')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD, nickname: TEST_NICK })
      .expect(201);
    expect(registerRes.body.email).toBe(TEST_EMAIL);

    // DB 에 emailVerified=false 로 만들어졌는지 확인
    const created = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
    expect(created).toBeTruthy();
    expect(created!.emailVerified).toBe(false);

    // 2. 미인증 상태 로그인 시도 → 403 + EMAIL_NOT_VERIFIED
    const blockedRes = await request(server)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
      .expect(403);
    expect(blockedRes.body.message?.code ?? blockedRes.body.code).toBe('EMAIL_NOT_VERIFIED');

    // 3. DB 에서 토큰 직접 가져와서 인증
    const tokenRow = await prisma.emailVerificationToken.findFirst({
      where: { userId: created!.id, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    expect(tokenRow).toBeTruthy();

    const verifyRes = await request(server)
      .post('/api/auth/verify-email')
      .send({ token: tokenRow!.token })
      .expect(201);
    expect(verifyRes.body.accessToken).toBeDefined();
    expect(verifyRes.body.user.emailVerified).toBe(true);

    // 4. 인증 후 로그인 성공
    const okRes = await request(server)
      .post('/api/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
      .expect(201);
    expect(okRes.body.accessToken).toBeDefined();
    expect(okRes.body.user.email).toBe(TEST_EMAIL);
    expect(okRes.body.user.emailVerified).toBe(true);
  });
});
