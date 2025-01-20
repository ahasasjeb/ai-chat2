import React, { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@nextui-org/react";
import { isValidEmail } from '@/utils/emailValidator';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (email: string, password: string, code: string) => Promise<void>;
  onSendCode: (email: string) => Promise<void>;
}

export default function RegisterModal({ isOpen, onClose, onRegister, onSendCode }: RegisterModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleSendCode = async () => {
    if (!isValidEmail(email)) {
      setError('请输入有效的邮箱地址（支持qq.com/163.com/126.com）');
      return;
    }

    try {
      setIsSendingCode(true);
      await onSendCode(email);
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送验证码失败');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleRegister = async () => {
    try {
      setError('');
      if (!email || !password || !code) {
        setError('请填写所有必填项');
        return;
      }

      if (!isValidEmail(email)) {
        setError('请输入有效的邮箱地址（支持qq.com/163.com/126.com）');
        return;
      }

      if (password !== confirmPassword) {
        setError('两次输入的密码不一致');
        return;
      }

      if (password.length < 6) {
        setError('密码长度至少6位');
        return;
      }

      setIsLoading(true);
      await onRegister(email, password, code);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>注册</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="请输入邮箱"
            />
            <div className="flex gap-2">
              <Input
                label="验证码"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="请输入验证码"
              />
              <Button
                color="primary"
                isDisabled={countdown > 0}
                isLoading={isSendingCode}
                onPress={handleSendCode}
              >
                {countdown > 0 ? `${countdown}秒后重试` : '发送验证码'}
              </Button>
            </div>
            <Input
              label="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="请输入密码"
            />
            <Input
              label="确认密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              placeholder="请再次输入密码"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            取消
          </Button>
          <Button color="primary" onPress={handleRegister} isLoading={isLoading}>
            注册
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
