import React, { useState, useEffect, useCallback } from 'react';
import { Card, Input, Layout, Button, Spin, message, Typography, Row, Col, Divider, Tag, Modal, Radio, Calendar, List, Space, Empty, Statistic } from 'antd';
import { LogoutOutlined, ReloadOutlined, GlobalOutlined, CheckCircleOutlined, SyncOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs, { Dayjs } from 'dayjs';

const { Header, Content } = Layout;
const { Search } = Input;
const { Title, Text } = Typography;

// --- Interfaces for API responses (no changes) ---
interface HeroImage {
  url: string;
}

interface EtaData {
  display_eta: number;
  country: string;
}

interface EntryProcess {
  dev_options?: {
    b2c_enable_checkout_pwon?: boolean;
  };
}

interface Country {
  name: string;
  iso2_code: string;
  purpose: string;
  price: number;
  currency: string;
  visas_done_in_k: number;
  service_type: string;
  supported: boolean;
  eta: EtaData;
  hero_image: HeroImage;
  category: string;
  entry_process?: EntryProcess;
}

interface CountriesApiResponse {
  countries: Country[];
}

interface CentreDate {
  centre_name: string;
  centre_name_fe: string;
  all_dates: string[];
}

interface SlotsApiResponse {
  ok: boolean;
  centre_dates: CentreDate[];
}

const Dashboard: React.FC = () => {
  const [apiData, setApiData] = useState<Country[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [nextRefresh, setNextRefresh] = useState(180);
  const [earliestDate,setEarliestDate] = useState<any>()
  const navigate = useNavigate();

  // State for the modal
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<SlotsApiResponse | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState('');

  const fetchVisaData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get<CountriesApiResponse>('https://api.atlys.com/api/v3/countries?citizenship=GB&residence=GB&pincode=641020&isEnterprise=false');
      const eres = await axios.get('https://api.atlys.com/api/v2/application/slots/FR?residence=GB&citizenship=IN&purpose=atlys_black&travellersCount=1&withAllSlots=true&getCitiesWiseSlots=false');
      if (response.data && Array.isArray(response.data.countries)) {
        const allowedCountries = [
          "France", "Greece", "Spain", "Netherlands", "Denmark", "Austria",
          "Belgium", "Bulgaria", "Croatia", "Czech Republic", "Estonia",
          "Finland", "Hungary", "Iceland", "Italy", "Latvia", "Lithuania",
          "Luxembourg", "Malta", "Norway", "Germany"
        ];

        const normalizedAllowed = allowedCountries.map(name => name.trim().toLowerCase());
        
        setApiData(
          response.data.countries
            .filter(
              (country) =>
                ['appointment', 'schengen_appointment'].includes(country.service_type) &&
                country.purpose === "atlys_black" &&
                normalizedAllowed.includes(country.name.trim().toLowerCase())
            )
        );
        setEarliestDate(eres?.data?.allSlots)
        message.success('Visa data updated successfully');
      } else {
        setApiData(null);
        message.warning('No valid data received.');
      }
    } catch (error) {
      console.error('Error fetching visa data:', error);
      message.error('Failed to fetch visa data');
      setApiData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAvailableDates = async (countryCode: string, countryName: string) => {
    setSlotsLoading(true);
    setIsModalVisible(true);
    setModalTitle(`Available Dates for ${countryName}`);
    setAvailableSlots(null); // Reset previous data
    setSelectedCity(null);

    try {
      const response = await axios.get<SlotsApiResponse>(`https://api.atlys.com/api/v2/application/slots/${countryCode}`, {
        params: { residence: "GB", citizenship: 'IN', purpose: "atlys_black", travellersCount: 1, withAllSlots: true, getCitiesWiseSlots: true }
      });

      if (response.data && response.data.ok) {
        setAvailableSlots(response.data);
        if (response.data.centre_dates.length > 0) {
          setSelectedCity(response.data.centre_dates[0].centre_name);
        }
      } else {
        message.error(`No slot data found for ${countryName}.`);
        setAvailableSlots(null);
      }
    } catch (error) {
      console.error(`Error fetching slots for ${countryCode}:`, error);
      message.error(`Could not fetch slots for ${countryName}.`);
      setAvailableSlots(null);
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    fetchVisaData();
  }, [fetchVisaData]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNextRefresh(prev => {
        if (prev <= 1) {
          fetchVisaData();
          return 180;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [fetchVisaData]);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };
  
  // --- Helper Functions (no changes) ---
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    return dayjs(timestamp).format('DD MMM YYYY');
  };

  const getCurrencySymbol = (currencyCode: string) => ({ GBP: '£', USD: '$', EUR: '€' }[currencyCode] || currencyCode);
  
  const dateCellRender = (value: Dayjs) => {
    const formattedDate = value.format('DD-MM-YYYY');
    const cityData = availableSlots?.centre_dates.find(c => c.centre_name === selectedCity);
    
    if (cityData?.all_dates.includes(formattedDate)) {
      return <div className="ant-picker-cell-inner ant-picker-cell-today" style={{background: '#e6f4ff', borderRadius: '50%', border: '1px solid #1677ff', position: "absolute", top: 0,left:0,color:"black"}}>{value.date()}</div>;
    }
    return null;
  };

  // --- Data for rendering (no changes) ---
  const filteredData = apiData?.filter(country => country.name.toLowerCase().includes(searchTerm.toLowerCase())) || [];
  const totalCountries = apiData?.length || 0;
  const totalVisasProcessed = apiData?.reduce((sum, country) => sum + country.visas_done_in_k, 0) || 0;
  const supportedCountries = apiData?.filter(c => c.supported).length || 0;

  // --- Custom component for List's empty state ---
  const EmptyListView = () => (
    <Card className="text-center py-16 mt-4">
      <Title level={3} className="text-gray-700">{searchTerm ? 'No Countries Found' : 'No Data Available'}</Title>
      <Text className="text-gray-500 mb-6">{searchTerm ? `Your search for "${searchTerm}" did not return any results.` : 'Could not load visa data.'}</Text>
      <div><Button type="primary" icon={<ReloadOutlined />} onClick={fetchVisaData}>Refresh Data</Button></div>
    </Card>
  );

  return (
    <Layout className="min-h-screen bg-gray-100">
      <Header className="bg-white shadow-sm border-b h-16 px-4 sticky top-0 z-10">
         <div className="flex items-center justify-between h-full max-w-screen-xl mx-auto">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
               <Text className="text-white font-bold text-sm">VS</Text>
             </div>
             <Title level={4} className="m-0 text-gray-800 hidden sm:block">Visa Status Dashboard</Title>
           </div>
           <div className="flex items-center gap-4">
             <Text className="text-sm text-gray-500 hidden sm:block">
               Next refresh: {formatTime(nextRefresh)}
             </Text>
             <Button icon={<ReloadOutlined />} onClick={fetchVisaData} loading={loading} type="primary" shape="circle" />
             <Button icon={<LogoutOutlined />} onClick={handleLogout} type="text" className="text-gray-500" />
           </div>
         </div>
      </Header>

      <Content className="p-4 sm:p-6">
        <div className="max-w-screen-xl mx-auto">
          {/* --- Search and Stats Card (no changes) --- */}
          <Card className="mb-6">
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={8} lg={10}>
                <Search
                  placeholder="Search countries..."
                  allowClear
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="large"
                />
              </Col>
              <Col xs={24} md={16} lg={14}>
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={() => setSearchTerm('')}>All</Button>
                  <Button onClick={() => setSearchTerm('France')}>France</Button>
                  <Button onClick={() => setSearchTerm('Spain')}>Spain</Button>
                  <Button onClick={() => setSearchTerm('Greece')}>Greece</Button>
                </div>
              </Col>
            </Row>
            <Divider />
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Statistic title="Total Countries" value={totalCountries} prefix={<GlobalOutlined />} />
              </Col>
             
              
            </Row>
          </Card>

          <div className="mb-4">
            <Title level={5}>Showing {filteredData.length} of {totalCountries} Countries</Title>
          </div>

          {/* --- REFACTORED COMPACT LIST --- */}
          <List
            itemLayout="horizontal"
            size="default"
            dataSource={filteredData}
            loading={loading}
            locale={{ emptyText: <EmptyListView /> }}
            pagination={{
              pageSize: 10, // Increased page size
              position: 'bottom',
              align: 'center',
            }}
            renderItem={(country) => (
              <List.Item
                key={country.iso2_code}
                className="bg-white px-4 py-2 rounded-lg shadow-sm mb-3"
                actions={[
                  <Button
                    size="small"
                    type="primary"
                    icon={<CalendarOutlined />}
                    onClick={() => fetchAvailableDates(country.iso2_code, country.name)}
                    style={{
                      display: ['appointment', 'schengen_appointment'].includes(country.service_type) ? 'inline-flex' : 'none'
                    }}
                  >
                    View Dates
                  </Button>
                ]}
              >
                <Row align="middle" gutter={[16, 8]} style={{ flex: 1, width: '100%',padding:10 }}>
                  <Col xs={24} sm={8} md={7} style={{ minWidth: '150px' }}>
                    <Title level={5} style={{ marginBottom: 0, fontSize: '1rem', fontWeight: 600 }} ellipsis={{ tooltip: country.name }}>
                      {country.name}
                    </Title>
                    
                  </Col>
                 
                 
                  <Col xs={12} sm={5} md={6}>
                    <div>
                      <Text type="secondary" style={{ fontSize: '0.75rem', display: 'block' }}>Earliest Appointment Date</Text>
                      {earliestDate?.[country.name.toLowerCase()] && Object.keys(earliestDate[country.name.toLowerCase()]).length > 0 ? (
                        <>
                          {Object.entries(earliestDate[country.name.toLowerCase()]).map(([city, data]: [string, any]) => (
                            <div key={city}>
                              <Text strong>{city.charAt(0).toUpperCase() + city.slice(1)}: </Text>
                              <Text>{data.earliest_slot}</Text>
                            </div>
                          ))}
                        </>
                      ) : (
                        <Text type="secondary">No data</Text>
                      )}
                    </div>
                  </Col>
                </Row>
              </List.Item>
            )}
          />
        </div>
      </Content>

      <Modal 
        title={modalTitle} 
        open={isModalVisible} 
        onCancel={() => setIsModalVisible(false)} 
        footer={null} 
        width={450}
      >
        <Spin spinning={slotsLoading}>
          {availableSlots && availableSlots.centre_dates.length > 0 ? (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Text strong>Select Appointment City:</Text>
                <div style={{ marginTop: '8px', textAlign: 'center' }}>
                    <Radio.Group onChange={(e) => setSelectedCity(e.target.value)} value={selectedCity}>
                    {availableSlots.centre_dates.map(city => (
                        <Radio.Button key={city.centre_name} value={city.centre_name}>{city.centre_name_fe}</Radio.Button>
                    ))}
                    </Radio.Group>
                </div>
              </div>
              <Divider style={{ margin: '4px 0' }} />
              <div style={{ border: '1px solid #f0f0f0', borderRadius: '8px', padding: '8px' }}>
                <Calendar fullscreen={false} cellRender={dateCellRender} />
              </div>
            </Space>
          ) : (
            <div style={{ padding: '32px 0' }}>
               <Empty description={
                slotsLoading 
                  ? "Fetching available slots..." 
                  : "No appointment slots found for this country."
               } />
            </div>
          )}
        </Spin>
      </Modal>
    </Layout>
  );
};

export default Dashboard;