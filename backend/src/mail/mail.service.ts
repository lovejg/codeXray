import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

type Transporter = nodemailer.Transporter;

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465,
        auth: { user, pass },
      });
      this.logger.log(`SMTP 초기화: ${host}:${port}`);
    } else {
      this.logger.warn('SMTP 환경변수 미설정 — 메일은 콘솔에만 출력됩니다 (dev 모드)');
    }
  }

  async sendVerificationEmail(to: string, nickname: string, link: string) {
    const subject = '[CodeXray] 이메일 인증을 완료해주세요';
    const text = [
      `안녕하세요, ${nickname}님!`,
      '',
      'CodeXray 가입을 완료하려면 아래 링크를 클릭해주세요:',
      link,
      '',
      '이 링크는 24시간 동안만 유효합니다.',
      '본인이 가입 신청하지 않았다면 이 메일을 무시해주세요.',
    ].join('\n');
    const html = `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a">
        <h2 style="color:#3b82f6">CodeXray 이메일 인증</h2>
        <p>안녕하세요, <b>${nickname}</b>님!</p>
        <p>CodeXray 가입을 완료하려면 아래 버튼을 눌러주세요:</p>
        <p>
          <a href="${link}" style="display:inline-block;padding:12px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:8px">이메일 인증하기</a>
        </p>
        <p style="font-size:12px;color:#666">버튼이 작동하지 않으면 다음 링크를 복사해서 열어주세요:<br><span style="word-break:break-all">${link}</span></p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="font-size:11px;color:#999">이 링크는 24시간 동안만 유효합니다. 본인이 가입 신청하지 않았다면 이 메일을 무시해주세요.</p>
      </div>
    `;

    if (!this.transporter) {
      this.logger.log('\n─── [DEV MAIL] ────────────────────────────────');
      this.logger.log(`To: ${to}`);
      this.logger.log(`Subject: ${subject}`);
      this.logger.log(`Link: ${link}`);
      this.logger.log('───────────────────────────────────────────────\n');
      return;
    }

    const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
    await this.transporter.sendMail({ from, to, subject, text, html });
    this.logger.log(`Verification mail sent to ${to}`);
  }
}
