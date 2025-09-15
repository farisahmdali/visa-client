import React, { useState, useEffect, useCallback } from 'react';
import { Card, Input, Badge, Layout, Button, Spin, message, Typography, Row, Col, Divider } from 'antd';
import { LogoutOutlined, ReloadOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import instance from '../utils/api';

const { Header, Content } = Layout;
const { Search } = Input;
const { Title, Text } = Typography;

interface SlotData {
  applicant: string;
  date: string;
}

interface CenterData {
  earliestDate: string | null;
  earliestSlotLists: SlotData[];
  error: {
    code: number;
    description: string;
  } | null;
}

interface CountryData {
  [centerName: string]: CenterData;
}

interface ApiResponse {
  message: string;
  version: string;
  data: {
    [countryName: string]: CountryData;
  };
}

const Dashboard: React.FC = () => {
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [nextRefresh, setNextRefresh] = useState(180); // 3 minutes in seconds
  const navigate = useNavigate();

  const fetchVisaSlots = useCallback(async () => {
    setLoading(true);
    try {
      const response = await instance.get('/');
      console.log('API Response:', response.data);
      
      if (response.data && response.data.message && response.data.data) {
        // Handle double nested data structure - the actual country data is in data.data.data
        let actualData;
        
        // Check if we have double nesting (data.data.data)
        if (response.data.data && response.data.data.data) {
          actualData = response.data.data.data;
        } else {
          // Fallback to single nesting (data.data)
          actualData = response.data.data;
        }
        
        console.log('Processed data:', actualData);
        
        // Create a properly formatted response object
        const formattedResponse: ApiResponse = {
          message: response.data.message,
          version: response.data.version,
          data: actualData
        };
        
        setApiData(formattedResponse);
        message.success('Visa slots updated successfully');
      } else {
        setApiData(null);
        message.warning('No valid data received');
      }
    } catch (error) {
      console.error('Error fetching visa slots:', error);
      message.error('Failed to fetch visa slots');
      setApiData(null);
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

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getCountryFlag = (countryName: string) => {
    switch (countryName.toLowerCase()) {
      case 'iceland': return '🇮🇸';
      case 'norway': return '🇳🇴';
      case 'malta': return '🇲🇹';
      case 'lithuania': return '🇱🇹';
      case 'latvia': return '🇱🇻';
      case 'italy': return '🇮🇹';
      case 'hungary': return '🇭🇺';
      case 'finland': return '🇫🇮';
      case 'estonia': return '🇪🇪';
      case 'czech': return '🇨🇿';
      case 'croatia': return '🇭🇷';
      case 'austria': return '🇦🇹';
      default: return '🌍';
    }
  };

  const getCountryColor = (countryName: string) => {
    switch (countryName.toLowerCase()) {
      case 'iceland': return 'blue';
      case 'norway': return 'green';
      case 'malta': return 'orange';
      case 'lithuania': return 'purple';
      case 'latvia': return 'red';
      case 'italy': return 'cyan';
      case 'hungary': return 'magenta';
      case 'finland': return 'lime';
      case 'estonia': return 'geekblue';
      case 'czech': return 'volcano';
      case 'croatia': return 'gold';
      case 'austria': return 'pink';
      default: return 'purple';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No date available';
    try {
      // Handle the specific date format: "09/16/2025 00:00:00"
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatTimeFromDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid time';
      }
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid time';
    }
  };

  // Filter data based on search term
  const filteredData = apiData ? Object.entries(apiData.data).filter(([countryName]) =>
    countryName.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  // Debug logging
  console.log('API Data:', apiData);
  console.log('Filtered Data:', filteredData);
  console.log('Search Term:', searchTerm);

  return (
    <Layout className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header className="bg-white shadow-sm border-b h-16 px-4">
        <div className="flex items-center justify-between h-full max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Text className="text-white font-bold text-sm">VS</Text>
            </div>
            <Title level={4} className="m-0 text-gray-800">Visa Slots Dashboard</Title>
            {apiData && (
              <div className="hidden sm:flex items-center gap-2 ml-4">
                <Badge count={Object.keys(apiData.data).length} color="blue" text="Countries" />
                <Badge 
                  count={Object.values(apiData.data).reduce((total, country) => 
                    total + Object.keys(country).length, 0
                  )} 
                  color="green" 
                  text="Centers" 
                />
              </div>
            )}
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
          {/* Search and Filters */}
          <div className="mb-6">
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={12} md={8}>
                <Search
                  placeholder="Search countries..."
                  allowClear
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="large"
                />
              </Col>
              <Col xs={24} sm={12} md={16}>
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    size="middle" 
                    onClick={() => setSearchTerm('')}
                    type="text"
                    className="text-gray-600 hover:bg-gray-50"
                  >
                    Show All
                  </Button>
                  <Button 
                    size="middle" 
                    onClick={() => setSearchTerm('iceland')}
                    type="text"
                    className="text-blue-600 hover:bg-blue-50 px-3 bg-blue-100 font-medium"
                  >
                    🇮🇸 Iceland
                  </Button>
                  <Button 
                    size="middle" 
                    onClick={() => setSearchTerm('norway')}
                    type="text"
                    className="text-green-600 hover:bg-green-50 px-3 bg-green-100 font-medium"
                  >
                    🇳🇴 Norway
                  </Button>
                  <Button 
                    size="middle" 
                    onClick={() => setSearchTerm('malta')}
                    type="text"
                    className="text-orange-600 hover:bg-orange-50 px-3 bg-orange-100 font-medium"
                  >
                    🇲🇹 Malta
                  </Button>
                  <Button 
                    size="middle" 
                    onClick={() => setSearchTerm('lithuania')}
                    type="text"
                    className="text-purple-600 hover:bg-purple-50 px-3 bg-purple-100 font-medium"
                  >
                    🇱🇹 Lithuania
                  </Button>
                </div>
              </Col>
            </Row>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <Spin size="large" />
              <Text className="block mt-4 text-gray-500">Loading visa slots...</Text>
            </div>
          )}

          {/* API Summary Cards */}
          {apiData && (
            <div className="mb-6">
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0 shadow-sm">
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={6}>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {Object.keys(apiData.data).length}
                      </div>
                      <Text className="text-gray-600">Countries</Text>
                    </div>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {Object.values(apiData.data).reduce((total, country) => 
                          total + Object.keys(country).length, 0
                        )}
                      </div>
                      <Text className="text-gray-600">Total Centers</Text>
                    </div>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600 mb-2">
                        {Object.values(apiData.data).reduce((total, country) => {
                          const countryTotal = Object.values(country).reduce((centerTotal, center) => 
                            centerTotal + (center.earliestSlotLists?.length || 0), 0
                          );
                          return total + countryTotal;
                        }, 0)}
                      </div>
                      <Text className="text-gray-600">Total Slots</Text>
                    </div>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600 mb-2">
                        {Object.values(apiData.data).reduce((total, country) => {
                          const countryErrors = Object.values(country).reduce((centerErrors, center) => 
                            centerErrors + (center.error ? 1 : 0), 0
                          );
                          return total + countryErrors;
                        }, 0)}
                      </div>
                      <Text className="text-gray-600">Errors</Text>
                    </div>
                  </Col>
                </Row>
              </Card>
            </div>
          )}

          {/* Countries and Centers Display */}
          {filteredData.length > 0 ? (
            <div className="space-y-6">
              {filteredData.map(([countryName, countryData]) => (
                <Card 
                  key={countryName}
                  className="shadow-sm border-l-4"
                  style={{ borderLeftColor: getCountryColor(countryName) === 'blue' ? '#3b82f6' : '#10b981' }}
                >
                  {/* Country Header */}
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{getCountryFlag(countryName)}</span>
                      <Title level={3} className="m-0">
                        {countryName.charAt(0).toUpperCase() + countryName.slice(1)} Visa Centers
                      </Title>
                      <Badge 
                        color={getCountryColor(countryName)}
                        text={`${Object.keys(countryData).length} Centers`}
                      />
                    </div>
                    <Text className="text-gray-500">
                      API Version: {apiData?.version} • {apiData?.message}
                    </Text>
                  </div>

                  {/* Centers Grid */}
                  <Row gutter={[16, 16]}>
                    {Object.entries(countryData).map(([centerName, centerData]) => (
                      <Col xs={24} lg={12} xl={8} key={centerName}>
                        <Card 
                          size="small" 
                          className={`h-full transition-all duration-300 hover:shadow-md ${
                            centerData.error ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'
                          }`}
                        >
                          {/* Center Header */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-2">
                              <Title level={5} className="m-0 text-gray-800">
                                🏢 {centerName}
                              </Title>
                              <Badge 
                                color={centerData.error ? 'red' : 'green'}
                                text={centerData.error ? 'Error' : 'Available'}
                              />
                            </div>
                          </div>

                          {/* Center Stats */}
                          <Row gutter={[8, 8]} className="mb-3">
                            <Col span={12}>
                              <div className="text-center p-2 bg-white rounded border">
                                <div className="text-lg font-bold text-blue-600">
                                  {centerData.earliestSlotLists?.length || 0}
                                </div>
                                <Text className="text-xs text-gray-600">Slots</Text>
                              </div>
                            </Col>
                            <Col span={12}>
                              <div className="text-center p-2 bg-white rounded border">
                                <div className="text-sm font-bold text-green-600">
                                  {formatDate(centerData.earliestDate)}
                                </div>
                                <Text className="text-xs text-gray-600">Earliest</Text>
                              </div>
                            </Col>
                          </Row>

                          {/* Error Display */}
                          {centerData.error && (
                            <div className="mb-3 p-2 bg-red-100 border border-red-200 rounded text-center">
                              <Text className="text-red-700 text-xs">
                                Error {centerData.error.code}: {centerData.error.description}
                              </Text>
                            </div>
                          )}

                          {/* Available Slots */}
                          {centerData.earliestSlotLists && centerData.earliestSlotLists.length > 0 && (
                            <div>
                              <Divider className="my-2" />
                              <Text className="text-xs font-medium text-gray-600 mb-2 block">
                                Available Appointments:
                              </Text>
                              <div className="space-y-2">
                                {centerData.earliestSlotLists.map((slot, index) => (
                                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                                    <div className="flex items-center gap-2">
                                      <UserOutlined className="text-blue-500" />
                                      <Text className="text-sm font-medium">
                                        Applicants: {slot.applicant}
                                      </Text>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-xs text-gray-500">
                                        {formatDate(slot.date)}
                                      </div>
                                      <div className="text-xs text-green-600 font-medium">
                                        {formatTimeFromDate(slot.date)}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card>
              ))}
            </div>
          ) : !loading && (
            /* Empty State */
            <div className="text-center py-16">
              <div className="text-6xl mb-4">
                {searchTerm ? '🔍' : '📭'}
              </div>
              <Title level={3} className="text-gray-700 mb-2">
                {searchTerm ? 'No countries found' : 'No data available'}
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

          {/* Debug Information */}
          {apiData && (
            <div className="mt-8">
              <Card size="small" className="bg-gray-50">
                <details>
                  <summary className="cursor-pointer font-medium text-gray-700 hover:text-blue-600 text-center">
                    🔍 Debug Information
                  </summary>
                  <div className="mt-4 space-y-4">
                    <div>
                      <Text className="font-medium">Countries found: {Object.keys(apiData.data).length}</Text>
                      <div className="text-xs text-gray-600 mt-1">
                        {Object.keys(apiData.data).join(', ')}
                      </div>
                    </div>
                    <div>
                      <Text className="font-medium">Filtered data: {filteredData.length}</Text>
                    </div>
                    <pre className="text-xs bg-white p-4 rounded border overflow-auto max-h-60">
                      {JSON.stringify(apiData, null, 2)}
                    </pre>
                  </div>
                </details>
              </Card>
            </div>
          )}
        </div>
      </Content>
    </Layout>
  );
};

export default Dashboard;
