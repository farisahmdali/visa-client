import React, { useState } from 'react';
import { Button, Form, Input, Card, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, GlobalOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      // Simulate login - you can replace this with actual authentication
      if (values.username === 'admin' && values.password === 'password') {
        message.success('Login successful!');
        localStorage.setItem('isAuthenticated', 'true');
        navigate('/dashboard');
      } else {
        message.error('Invalid credentials');
      }
    } catch (error) {
      message.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-white opacity-10 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-white opacity-10 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-32 left-1/3 w-40 h-40 bg-white opacity-10 rounded-full animate-pulse delay-2000"></div>
        <div className="absolute bottom-20 right-20 w-20 h-20 bg-white opacity-10 rounded-full animate-pulse delay-500"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-4">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <GlobalOutlined className="text-4xl text-white" />
              </div>
            </div>
            <Title level={1} className="text-white mb-2 text-3xl font-bold">
              Visa Slot Checker
            </Title>
            <Text className="text-blue-100 text-lg">
              Your gateway to visa appointment tracking
            </Text>
          </div>

          {/* Login Card */}
          <Card 
            className="shadow-2xl border-0 bg-white bg-opacity-95 backdrop-blur-sm"
            style={{ borderRadius: '16px' }}
          >
            <div className="p-2">
              <Title level={3} className="text-center text-gray-800 mb-6">
                Welcome Back
              </Title>
              
              <Form
                name="login"
                onFinish={onFinish}
                autoComplete="off"
                layout="vertical"
                size="large"
              >
                <Form.Item
                  name="username"
                  rules={[{ required: true, message: 'Please input your username!' }]}
                  className="mb-4"
                >
                  <Input
                    prefix={<UserOutlined className="text-gray-400" />}
                    placeholder="Enter username"
                    className="h-12 rounded-lg border-gray-200 hover:border-blue-400 focus:border-blue-500"
                    style={{
                      fontSize: '16px',
                      boxShadow: 'none',
                    }}
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[{ required: true, message: 'Please input your password!' }]}
                  className="mb-6"
                >
                  <Input.Password
                    prefix={<LockOutlined className="text-gray-400" />}
                    placeholder="Enter password"
                    className="h-12 rounded-lg border-gray-200 hover:border-blue-400 focus:border-blue-500"
                    style={{
                      fontSize: '16px',
                      boxShadow: 'none',
                    }}
                  />
                </Form.Item>

                <Form.Item className="mb-4">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    className="w-full h-12 rounded-lg text-base font-semibold"
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                    }}
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </Form.Item>
              </Form>
              
              <div className="text-center">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <Text className="text-blue-700 text-sm font-medium">
                    🔑 Demo Credentials
                  </Text>
                  <br />
                  <Text className="text-blue-600 text-sm">
                    Username: <strong>admin</strong> • Password: <strong>password</strong>
                  </Text>
                </div>
              </div>
            </div>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8">
            <Text className="text-blue-100 text-sm">
              Secure • Fast • Reliable
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
