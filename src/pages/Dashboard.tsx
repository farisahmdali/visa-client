import React, { useState, useEffect, useCallback } from 'react';
import { Card, Input, Badge, Layout, Button, Spin, message, Typography } from 'antd';
import { LogoutOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import instance from '../utils/api';

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

interface IcelandSlotData {
  message: string;
  version: string;
  data: {
    earliestDate: string;
    earliestSlotLists: Array<{
      applicant: string;
      date: string;
    }>;
    error: string | null;
  };
}

const Dashboard: React.FC = () => {
  const [visaSlots, setVisaSlots] = useState<VisaSlot[]>([]);
  const [filteredSlots, setFilteredSlots] = useState<VisaSlot[]>([]);
  const [icelandData, setIcelandData] = useState<IcelandSlotData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [nextRefresh, setNextRefresh] = useState(180); // 3 minutes in seconds
  const navigate = useNavigate();

  // No mock data - using only real API data

  const fetchVisaSlots = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await instance.get('/');
      console.log('API Response:', response.data);
      
      // Check if the response has the expected Iceland data structure
      if (response.data && response.data.message && response.data.data) {
        // It's the Iceland API response
        setIcelandData(response.data as IcelandSlotData);
        
        // Convert Iceland data to VisaSlot format for the main display
        const icelandSlot: VisaSlot = {
          country: 'Iceland',
          flag: '🇮🇸',
          totalSlots: response.data.data.earliestSlotLists?.length || 0,
          availableSlots: response.data.data.error ? 0 : response.data.data.earliestSlotLists?.length || 0,
          availableTimes: response.data.data.earliestSlotLists?.map((slot: any) => 
            new Date(slot.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          ) || [],
          nextAvailableDate: response.data.data.earliestDate || 'No date available',
          lastUpdated: new Date().toISOString(),
          status: response.data.data.error ? 'unavailable' : 
                  response.data.data.earliestSlotLists?.length > 0 ? 'available' : 'unavailable'
        };
        
        // Only show Iceland data - no mock data
        setVisaSlots([icelandSlot]);
        setFilteredSlots([icelandSlot]);
      } else {
        // No valid data - show empty state
        setVisaSlots([]);
        setFilteredSlots([]);
        setIcelandData(null);
      }
      
      message.success('Visa slots updated successfully');
    } catch (error) {
      console.error('Error fetching visa slots:', error);
      message.error('Failed to fetch visa slots');
      
      // Clear data on error
      setVisaSlots([]);
      setFilteredSlots([]);
      setIcelandData(null);
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
              <Button 
                size="small" 
                onClick={() => setSearchTerm('Iceland')}
                type="text"
                className="text-blue-600 hover:bg-blue-50 px-2 bg-blue-100 font-medium"
              >
                🇮🇸 Iceland
              </Button>
              <Button 
                size="small" 
                onClick={() => setSearchTerm('')}
                type="text"
                className="text-gray-600 hover:bg-gray-50 px-2"
              >
                Show All
              </Button>
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
                        {/* Show applicant numbers for Iceland */}
                        {slot.country === 'Iceland' && icelandData && icelandData.data.earliestSlotLists && (
                          <div className="flex gap-1 mt-1">
                            {icelandData.data.earliestSlotLists.map((slotData, slotIndex) => (
                              <div key={slotIndex} className="flex gap-1">
                                {slotData.applicant.split(', ').map((applicantNum, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-block px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded font-medium"
                                  >
                                    #{applicantNum}
                                  </span>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
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

                      {/* Applicant Information for Iceland */}
                      {slot.country === 'Iceland' && icelandData && (
                        <div className="text-right hidden md:block max-w-xs">
                          <div className="flex flex-wrap gap-1 justify-end">
                            {icelandData.data.earliestSlotLists?.map((slotData, slotIndex) => (
                              <div key={slotIndex} className="flex gap-1">
                                {slotData.applicant.split(', ').map((applicantNum, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium"
                                  >
                                    #{applicantNum}
                                  </span>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Available Times - Compact (for non-Iceland) */}
                      {slot.country !== 'Iceland' && (
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
                      )}

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

          {/* Iceland API Data Section */}
          {icelandData && (
            <div className="mt-6">
              <Card className="border-l-4 border-l-blue-500">
                <div className="mb-4">
                  <Title level={3} className="flex items-center gap-3 mb-3">
                    🇮🇸 Iceland Visa Slots - Live API Data
                    <Badge 
                      color={icelandData.data.error ? 'red' : icelandData.data.earliestSlotLists?.length > 0 ? 'green' : 'orange'} 
                      text={icelandData.data.error ? 'Error' : icelandData.data.earliestSlotLists?.length > 0 ? 'Available' : 'No Slots'}
                    />
                  </Title>
                  <div className="flex items-center gap-4 mb-2">
                    <Text className="text-gray-500">API Version: {icelandData.version}</Text>
                    {icelandData.data.earliestSlotLists && icelandData.data.earliestSlotLists.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Text className="text-gray-500">Applicants Available:</Text>
                        <div className="flex gap-1">
                          {icelandData.data.earliestSlotLists.map((slotData, slotIndex) => (
                            <div key={slotIndex} className="flex gap-1">
                              {slotData.applicant.split(', ').map((applicantNum, idx) => (
                                <span
                                  key={idx}
                                  className="inline-block px-2 py-1 bg-green-100 text-green-700 text-sm rounded font-bold"
                                >
                                  #{applicantNum}
                                </span>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Earliest Date Card */}
                  <Card size="small" className="bg-blue-50">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {icelandData.data.earliestDate ? 
                          new Date(icelandData.data.earliestDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          }) : 'No Date'
                        }
                      </div>
                      <Text className="text-sm text-gray-600">Earliest Available Date</Text>
                    </div>
                  </Card>

                  {/* Total Slots Card */}
                  <Card size="small" className="bg-green-50">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {icelandData.data.earliestSlotLists?.length || 0}
                      </div>
                      <Text className="text-sm text-gray-600">Available Slots</Text>
                    </div>
                  </Card>

                  {/* Status Card */}
                  <Card size="small" className={`${icelandData.data.error ? 'bg-red-50' : 'bg-gray-50'}`}>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${icelandData.data.error ? 'text-red-600' : 'text-gray-600'}`}>
                        {icelandData.data.error ? '❌' : '✅'}
                      </div>
                      <Text className="text-sm text-gray-600">
                        {icelandData.data.error ? 'Error Detected' : 'System OK'}
                      </Text>
                    </div>
                  </Card>
                </div>

                {/* Error Display */}
                {icelandData.data.error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <Text className="text-red-700 font-medium">Error: {icelandData.data.error}</Text>
                  </div>
                )}

                {/* Available Slots Details */}
                {icelandData.data.earliestSlotLists && icelandData.data.earliestSlotLists.length > 0 && (
                  <div className="mt-4">
                    <Title level={5} className="mb-3">Available Appointment Slots</Title>
                    <div className="grid gap-3">
                      {icelandData.data.earliestSlotLists.map((slot, index) => (
                        <Card key={index} size="small" className="bg-gradient-to-r from-blue-50 to-green-50 border-l-4 border-l-blue-500">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                              <div className="bg-blue-600 text-white px-3 py-1 rounded-full font-bold text-sm">
                                Applicants: {slot.applicant}
                              </div>
                              <div className="flex gap-1">
                                {slot.applicant.split(', ').map((applicantNum, idx) => (
                                  <span 
                                    key={idx}
                                    className="bg-white border-2 border-blue-300 text-blue-700 px-2 py-1 rounded-full text-sm font-semibold"
                                  >
                                    #{applicantNum}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-blue-600 font-bold text-lg">
                                {new Date(slot.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="text-green-600 font-semibold">
                                {new Date(slot.date).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* API Response Details (Collapsible) */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <details>
                    <summary className="cursor-pointer font-medium text-gray-700 hover:text-blue-600">
                      View Raw API Response
                    </summary>
                    <pre className="mt-2 text-xs bg-white p-3 rounded border overflow-auto max-h-40">
                      {JSON.stringify(icelandData, null, 2)}
                    </pre>
                  </details>
                </div>
              </Card>
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
