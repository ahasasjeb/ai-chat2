const ALLOWED_DOMAINS = ['qq.com', '163.com', '126.com'];

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;
  
  const domain = email.split('@')[1].toLowerCase();
  return ALLOWED_DOMAINS.includes(domain);
}
