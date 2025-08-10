import React, { useState, useEffect, useCallback } from 'react';
import { Card, Input, Badge, Layout, Button, Spin, message, Typography } from 'antd';
import { LogoutOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Header, Content } = Layout;
const { Search } = Input;
const { Title, Text } = Typography;

interface VisaSlot {
  country: string;
  flag: string;
  totalSlots: number;
  availableSlots: number;
  availableTimes: string[];
  nextAvailableDate: string;
  lastUpdated: string;
  status: 'available' | 'limited' | 'unavailable';
}

const Dashboard: React.FC = () => {
  const [visaSlots, setVisaSlots] = useState<VisaSlot[]>([]);
  const [filteredSlots, setFilteredSlots] = useState<VisaSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [nextRefresh, setNextRefresh] = useState(180); // 3 minutes in seconds
  const navigate = useNavigate();

  // Mock data - replace with actual API calls
  const mockVisaData: VisaSlot[] = [
    {
      country: 'Germany',
      flag: '🇩🇪',
      totalSlots: 25,
      availableSlots: 15,
      availableTimes: ['09:00', '10:30', '14:00', '15:30', '16:45'],
      nextAvailableDate: '2024-03-15',
      lastUpdated: new Date().toISOString(),
      status: 'available'
    },
    {
      country: 'United States',
      flag: '🇺🇸',
      totalSlots: 20,
      availableSlots: 3,
      availableTimes: ['11:00', '14:30', '16:00'],
      nextAvailableDate: '2024-04-22',
      lastUpdated: new Date().toISOString(),
      status: 'limited'
    },
    {
      country: 'United Kingdom',
      flag: '🇬🇧',
      totalSlots: 18,
      availableSlots: 0,
      availableTimes: [],
      nextAvailableDate: '2024-06-10',
      lastUpdated: new Date().toISOString(),
      status: 'unavailable'
    },
    {
      country: 'Canada',
      flag: '🇨🇦',
      totalSlots: 22,
      availableSlots: 8,
      availableTimes: ['09:30', '11:00', '13:30', '15:00'],
      nextAvailableDate: '2024-03-28',
      lastUpdated: new Date().toISOString(),
      status: 'available'
    },
    {
      country: 'Australia',
      flag: '🇦🇺',
      totalSlots: 15,
      availableSlots: 2,
      availableTimes: ['10:00', '15:30'],
      nextAvailableDate: '2024-05-05',
      lastUpdated: new Date().toISOString(),
      status: 'limited'
    },
    {
      country: 'France',
      flag: '🇫🇷',
      totalSlots: 30,
      availableSlots: 12,
      availableTimes: ['09:00', '10:00', '11:30', '14:00', '15:30', '16:30'],
      nextAvailableDate: '2024-03-20',
      lastUpdated: new Date().toISOString(),
      status: 'available'
    },
    {
      country: 'Italy',
      flag: '🇮🇹',
      totalSlots: 16,
      availableSlots: 6,
      availableTimes: ['09:30', '11:00', '14:30', '16:00'],
      nextAvailableDate: '2024-03-25',
      lastUpdated: new Date().toISOString(),
      status: 'available'
    },
    {
      country: 'Spain',
      flag: '🇪🇸',
      totalSlots: 12,
      availableSlots: 1,
      availableTimes: ['15:00'],
      nextAvailableDate: '2024-05-12',
      lastUpdated: new Date().toISOString(),
      status: 'limited'
    }
  ];

  const fetchVisaSlots = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real application, you would fetch from your API
      // const response = await fetch('/api/visa-slots');
      // const data = await response.json();
      
      // For now, use mock data with some randomization
      const updatedData = mockVisaData.map(slot => {
        const newAvailableSlots = Math.max(0, slot.availableSlots + Math.floor(Math.random() * 5) - 2);
        const newStatus = newAvailableSlots > 5 ? 'available' : newAvailableSlots > 0 ? 'limited' : 'unavailable';
        
        return {
          ...slot,
          availableSlots: newAvailableSlots,
          status: newStatus as 'available' | 'limited' | 'unavailable',
          availableTimes: newAvailableSlots > 0 ? slot.availableTimes.slice(0, newAvailableSlots) : [],
          lastUpdated: new Date().toISOString()
        };
      });
      
      setVisaSlots(updatedData);
      setFilteredSlots(updatedData);
      message.success('Visa slots updated successfully');
    } catch (error) {
      message.error('Failed to fetch visa slots');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVisaSlots();
  }, [fetchVisaSlots]);

  // Auto-refresh timer
  useEffect(() => {
    const timer = setInterval(() => {
      setNextRefresh(prev => {
        if (prev <= 1) {
          fetchVisaSlots();
          return 180; // Reset to 3 minutes
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchVisaSlots]);

  // Search functionality
  useEffect(() => {
    const filtered = visaSlots.filter(slot =>
      slot.country.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredSlots(filtered);
  }, [searchTerm, visaSlots]);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'green';
      case 'limited': return 'orange';
      case 'unavailable': return 'red';
      default: return 'default';
    }
  };



  return (
    <Layout className="min-h-screen bg-gray-50">
      {/* Compact Header */}
      <Header className="bg-white shadow-sm border-b h-16 px-4">
        <div className="flex items-center justify-between h-full max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Text className="text-white font-bold text-sm">VS</Text>
            </div>
            <Title level={4} className="m-0 text-gray-800">Visa Slots</Title>
            <div className="hidden sm:flex items-center gap-2 ml-4">
              <Badge count={filteredSlots.filter(s => s.status === 'available').length} color="green" />
              <Badge count={filteredSlots.filter(s => s.status === 'limited').length} color="orange" />
              <Badge count={filteredSlots.filter(s => s.status === 'unavailable').length} color="red" />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Text className="text-xs text-gray-500 hidden sm:block">Next: {formatTime(nextRefresh)}</Text>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchVisaSlots}
              loading={loading}
              size="small"
              type="primary"
            />
            <Button
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              size="small"
              type="text"
              className="text-gray-500"
            />
          </div>
        </div>
      </Header>

      <Content className="p-4">
        <div className="max-w-7xl mx-auto">
          {/* Compact Search */}
          <div className="mb-4 flex flex-col sm:flex-row gap-2">
            <Search
              placeholder="Search countries..."
              allowClear
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 max-w-xs"
              size="middle"
            />
            <div className="flex gap-1 flex-wrap">
              {['Germany', 'USA', 'Canada', 'Australia'].map(country => (
                <Button 
                  key={country}
                  size="small" 
                  onClick={() => setSearchTerm(country)}
                  type="text"
                  className="text-blue-600 hover:bg-blue-50 px-2"
                >
                  {country}
                </Button>
              ))}
            </div>
          </div>

          {loading && !visaSlots.length ? (
            <div className="text-center py-12">
              <Spin size="large" />
              <Text className="block mt-4 text-gray-500">Loading visa slots...</Text>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredSlots.map((slot, index) => (
                <Card 
                  key={slot.country}
                  size="small"
                  className={`hover:shadow-md transition-shadow border-l-4 ${
                    slot.status === 'available' ? 'border-l-green-500' :
                    slot.status === 'limited' ? 'border-l-orange-500' : 'border-l-red-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {/* Country Info - Compact */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-2xl">{slot.flag}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Text className="font-semibold text-gray-800 truncate">{slot.country}</Text>
                          <Badge
                            color={getStatusColor(slot.status)}
                            size="small"
                            className="shrink-0"
                          />
                        </div>
                        <Text className="text-xs text-gray-500">
                          Updated: {new Date(slot.lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </Text>
                      </div>
                    </div>

                    {/* Stats - Horizontal Layout */}
                    <div className="flex items-center gap-6 shrink-0">
                      {/* Available/Total */}
                      <div className="text-center">
                        <div className={`text-xl font-bold ${
                          slot.availableSlots > 5 ? 'text-green-600' : 
                          slot.availableSlots > 0 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {slot.availableSlots}/{slot.totalSlots}
                        </div>
                        <Text className="text-xs text-gray-500">available</Text>
                      </div>

                      {/* Next Date */}
                      <div className="text-center hidden sm:block">
                        <div className="text-sm font-semibold text-blue-600">
                          {new Date(slot.nextAvailableDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <Text className="text-xs text-gray-500">next date</Text>
                      </div>

                      {/* Available Times - Compact */}
                      <div className="text-right hidden md:block max-w-xs">
                        {slot.availableTimes.length > 0 ? (
                          <div className="flex flex-wrap gap-1 justify-end">
                            {slot.availableTimes.slice(0, 4).map((time, timeIndex) => (
                              <span
                                key={timeIndex}
                                className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium"
                              >
                                {time}
                              </span>
                            ))}
                            {slot.availableTimes.length > 4 && (
                              <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                +{slot.availableTimes.length - 4}
                              </span>
                            )}
                          </div>
                        ) : (
                          <Text className="text-xs text-gray-400">No times</Text>
                        )}
                      </div>

                      {/* Progress Indicator */}
                      <div className="w-2 h-12 rounded-full bg-gray-200 overflow-hidden">
                        <div 
                          className={`w-full transition-all duration-300 ${
                            slot.availableSlots > 5 ? 'bg-green-500' : 
                            slot.availableSlots > 0 ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{ 
                            height: `${Math.max(4, Math.min(100, (slot.availableSlots / slot.totalSlots) * 100))}%`,
                            transform: 'translateY(100%)',
                            animation: `slideUp 0.5s ease-out ${index * 0.1}s forwards`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {filteredSlots.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">
                {searchTerm ? '🔍' : '📭'}
              </div>
              <Title level={3} className="text-gray-700 mb-2">
                {searchTerm ? 'No matches found' : 'No data available'}
              </Title>
              <Text className="text-gray-500 mb-6">
                {searchTerm 
                  ? `No countries found matching "${searchTerm}"`
                  : 'No visa slot data available at the moment'
                }
              </Text>
              
              <div className="flex gap-3 justify-center">
                {searchTerm && (
                  <Button 
                    onClick={() => setSearchTerm('')}
                    type="default"
                  >
                    Clear search
                  </Button>
                )}
                <Button 
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={fetchVisaSlots}
                >
                  Refresh Data
                </Button>
              </div>
            </div>
          )}
        </div>
      </Content>
    </Layout>
  );
};

export default Dashboard;
