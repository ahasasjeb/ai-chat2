import { MySql } from './MySql';
import { createTransport } from 'nodemailer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret';
const EMAIL_USER = process.env.EMAIL_USER;  // QQ邮箱地址
const EMAIL_PASS = process.env.EMAIL_PASS;  // QQ邮箱授权码

const transporter = createTransport({
  host: 'smtp.qq.com',
  port: 465,
  secure: true,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS // 这里使用QQ邮箱的授权码,不是QQ密码
  }
});

const verificationCodes = new Map<string, { code: string, expiry: number }>();

export async function sendVerificationCode(email: string) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes.set(email, {
    code,
    expiry: Date.now() + 10 * 60 * 1000 // 10分钟
  });

  await transporter.sendMail({
    from: `"AI助手" <${EMAIL_USER}>`, // 发件人显示名称
    to: email,
    subject: 'AI助手 - 验证码',
    text: `您的验证码是: ${code}，10分钟内有效`,
    html: `
      <div style="padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
        <h2 style="color: #1a73e8;">AI助手 - 验证码</h2>
        <p>您好，</p>
        <p>您的验证码是: <strong style="color: #1a73e8; font-size: 20px;">${code}</strong></p>
        <p>该验证码将在10分钟后过期。</p>
        <p>如果这不是您的操作，请忽略此邮件。</p>
      </div>
    `
  });
}

export async function verifyCode(email: string, code: string): Promise<boolean> {
  const stored = verificationCodes.get(email);
  if (!stored) return false;
  if (Date.now() > stored.expiry) {
    verificationCodes.delete(email);
    return false;
  }
  return stored.code === code;
}

export async function registerUser(email: string, password: string, code: string) {
  try {
    if (!await verifyCode(email, code)) {
      throw new Error('验证码无效或已过期');
    }

    const pool = await MySql.getInstance();
    
    const [existingUsers] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      throw new Error('该邮箱已被注册');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    await pool.query(
      'INSERT INTO users (email, password) VALUES (?, ?)',
      [email, hashedPassword]
    );
    
    console.log('用户注册成功:', email);
    verificationCodes.delete(email);
    
  } catch (err) {
    console.error('注册过程出错:', err);
    throw err instanceof Error ? err : new Error('注册失败');
  }
}

interface UserRow extends RowDataPacket {
  id: number;
  email: string;
  password: string;
}

export async function loginUser(email: string, password: string) {
  const pool = await MySql.getInstance();
  
  const [rows] = await pool.query<UserRow[]>(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );

  if (!rows.length) {
    throw new Error('用户不存在');
  }

  const user = rows[0];
  const valid = await bcrypt.compare(password, user.password);
  
  if (!valid) {
    throw new Error('密码错误');
  }

  return jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
}

export async function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number };
  } catch {
    throw new Error('无效的token');
  }
}
