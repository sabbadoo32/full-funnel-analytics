import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
  Container, TextField, Button, Typography, Box, Grid, Paper,
  CircularProgress, IconButton, Divider, Tabs, Tab,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import Plot from 'react-plotly.js';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentVisualization, setCurrentVisualization] = useState(null);
  const [campaignTag, setCampaignTag] = useState('');
  const [date, setDate] = useState('');
  const [response, setResponse] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (content, isUser = false, visualization = null) => {
    setMessages(prev => [...prev, { content, isUser, visualization }]);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    addMessage(userMessage, true);
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3000/chatgpt/query', {
        query: userMessage
      });

      const { data, visualization, explanation } = response.data;
      
      // Add bot response with visualization
      addMessage(explanation, false, {
        data: visualization.data,
        layout: visualization.layout
      });

    } catch (error) {
      console.error('Error:', error);
      addMessage('Sorry, I encountered an error processing your request.', false);
    } finally {
      setLoading(false);
    }
  };

  // Render visualization for each category
  const renderCategoryVisuals = (category, data) => {
    if (!data) return null;

    switch(category) {
      case 'eventData':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Plot
                data={[{
                  type: 'pie',
                  labels: ['Attended', 'Not Attended'],
                  values: [data['Attended'] || 0, data['Total'] - (data['Attended'] || 0)],
                  hole: 0.4
                }]}
                layout={{ title: 'Attendance Rate' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Plot
                data={[{
                  type: 'bar',
                  x: ['Status', 'Role', 'Event Type'],
                  y: [data['Status'], data['Role'], data['Event Type']].map(v => v || 0)
                }]}
                layout={{ title: 'Event Metrics' }}
              />
            </Grid>
          </Grid>
        );

      case 'demographics':
        const demographicFields = FIELD_CATEGORIES.demographics.fields;
        return (
          <Grid container spacing={3}>
            {demographicFields.map(field => (
              <Grid item xs={12} md={6} key={field}>
                <Plot
                  data={[{
                    type: 'pie',
                    labels: Object.keys(data[field] || {}),
                    values: Object.values(data[field] || {})
                  }]}
                  layout={{ title: field }}
                />
              </Grid>
            ))}
          </Grid>
        );

      case 'webAnalytics':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Plot
                data={[{
                  type: 'scatter',
                  mode: 'lines+markers',
                  x: ['Sessions', 'Active users', 'New users'],
                  y: [data['Sessions'], data['Active users'], data['New users']].map(v => v || 0)
                }]}
                layout={{ title: 'User Metrics' }}
              />
            </Grid>
            <Grid item xs={12}>
              <Plot
                data={[{
                  type: 'bar',
                  x: ['Engagement Time', 'Key Events', 'Revenue'],
                  y: [data['Average engagement time per session'], data['Key events'], data['Total revenue']].map(v => v || 0)
                }]}
                layout={{ title: 'Engagement Metrics' }}
              />
            </Grid>
          </Grid>
        );

      case 'socialMedia':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6">Facebook Metrics</Typography>
              <Plot
                data={[{
                  type: 'bar',
                  x: ['Reactions', 'Comments', 'Shares'],
                  y: [data['Reactions'], data['Comments'], data['Shares']].map(v => v || 0)
                }]}
                layout={{ title: 'Facebook Engagement' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6">Instagram Metrics</Typography>
              <Plot
                data={[{
                  type: 'bar',
                  x: ['Impressions', 'Clicks', 'Completions'],
                  y: [data['impressions'], data['clicks'], data['completions']].map(v => v || 0)
                }]}
                layout={{ title: 'Instagram Engagement' }}
              />
            </Grid>
          </Grid>
        );

      case 'campaignActivities':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6">P2P Metrics</Typography>
              <Plot
                data={[{
                  type: 'bar',
                  x: ['Initial', 'Follow Ups', 'Responses', 'Opt Outs'],
                  y: [
                    data['p2p_initial_messages'],
                    data['p2p_follow_ups'],
                    data['p2p_responses'],
                    data['p2p_opt_outs']
                  ].map(v => v || 0)
                }]}
                layout={{ title: 'P2P Communication' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6">F2F Metrics</Typography>
              <Plot
                data={[{
                  type: 'bar',
                  x: ['Messages Sent', 'Phones Reached', 'Followed Up'],
                  y: [
                    data['f2f_initial_messages_sent'],
                    data['f2f_unique_phones_reached'],
                    data['f2f_contacts_followed_up_with']
                  ].map(v => v || 0)
                }]}
                layout={{ title: 'F2F Communication' }}
              />
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ height: '100vh', py: 2 }}>
      <Paper elevation={3} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h5">MU Marketing Analytics Assistant</Typography>
        </Box>

        {/* Messages and Visualization Area */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto', 
          p: 2, 
          display: 'flex',
          flexDirection: 'column',
          gap: 2 
        }}>
          {messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                alignSelf: message.isUser ? 'flex-end' : 'flex-start',
                maxWidth: '70%'
              }}
            >
              {/* Message */}
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  bgcolor: message.isUser ? 'primary.main' : 'grey.100',
                  color: message.isUser ? 'white' : 'text.primary'
                }}
              >
                <Typography>{message.content}</Typography>
              </Paper>

              {/* Visualization if present */}
              {message.visualization && (
                <Paper sx={{ mt: 2, p: 2 }}>
                  <Plot
                    data={message.visualization.data}
                    layout={message.visualization.layout}
                    style={{ width: '100%', height: '400px' }}
                  />
                </Paper>
              )}
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input Area */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Ask about your marketing data..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                disabled={loading}
              />
            </Grid>
            <Grid item>
              <IconButton 
                color="primary" 
                onClick={handleSend}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : <SendIcon />}
              </IconButton>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}

const FIELD_CATEGORIES = {
  socialMedia: {
    title: 'Social Media',
    facebook: [
      'Post ID', 'Page ID', 'Page name', 'Title', 'Description', 'Duration (sec)',
      'Publish time', 'Caption type', 'Permalink', 'Is crosspost', 'Is share',
      'Post type', 'Reactions, Comments and Shares', 'Reactions', 'Comments',
      'Shares', 'Seconds viewed', 'Average Seconds viewed', 'Estimated earnings (USD)'
    ],
    instagram: [
      'title', 'description', 'Publish Date', 'privacy_setting', 'impressions',
      'clicks', 'seen', 'started', 'completions'
    ]
  },
  advertising: {
    title: 'Advertising',
    fields: [
      'Ad impressions', 'IMPRESSION:UNIQUE_USERS', 'Views', 'Reach',
      'Total clicks', 'Other Clicks', 'Link Clicks', 'Ad CPM (USD)',
      'Matched Audience Targeting Consumption (Photo Click)',
      'Negative feedback from users: Hide all'
    ]
  },
  contactManagement: {
    title: 'Contact Management',
    fields: [
      'Email', 'Last name', 'First name', 'Mobile number',
      'Group leader', 'contact_list_name'
    ]
  },
  campaignActivities: {
    title: 'Campaign Activities',
    p2p: [
      'p2p_initial_messages', 'p2p_follow_ups', 'p2p_responses',
      'p2p_opt_outs', 'p2p_messages_remaining', 'p2p_needs_attention',
      'p2p_undelivered'
    ],
    dialer: [
      'dialer_calls_connected', 'dialer_contacts_connected',
      'dialer_dropped_call_count', 'dialer_report_filled_count'
    ],
    f2f: [
      'f2f_initial_messages_sent', 'f2f_unique_phones_reached',
      'f2f_contacts_followed_up_with', 'f2f_suggested_contacts_known',
      'f2f_suggested_contacts_reached'
    ],
    openCanvass: [
      'open_canvass_personal_contact_reports',
      'open_canvass_campaign_contact_reports',
      'open_canvass_contact_numbers_provided'
    ]
  },
  technical: {
    title: 'Technical Data',
    fields: ['Query Parameters', 'IP', 'Browser', 'Browser Version', 'Device Type']
  }
};

const App2 = () => {
  const [campaignTag, setCampaignTag] = useState('');
  const [date, setDate] = useState('');
  const [response, setResponse] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Render visualization for each category
  const renderCategoryVisuals = (category, data) => {
    if (!data) return null;

    switch(category) {
      case 'eventData':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Plot
                data={[{
                  type: 'pie',
                  labels: ['Attended', 'Not Attended'],
                  values: [data['Attended'] || 0, data['Total'] - (data['Attended'] || 0)],
                  hole: 0.4
                }]}
                layout={{ title: 'Attendance Rate' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Plot
                data={[{
                  type: 'bar',
                  x: ['Status', 'Role', 'Event Type'],
                  y: [data['Status'], data['Role'], data['Event Type']].map(v => v || 0)
                }]}
                layout={{ title: 'Event Metrics' }}
              />
            </Grid>
          </Grid>
        );

      case 'demographics':
        const demographicFields = FIELD_CATEGORIES.demographics.fields;
        return (
          <Grid container spacing={3}>
            {demographicFields.map(field => (
              <Grid item xs={12} md={6} key={field}>
                <Plot
                  data={[{
                    type: 'pie',
                    labels: Object.keys(data[field] || {}),
                    values: Object.values(data[field] || {})
                  }]}
                  layout={{ title: field }}
                />
              </Grid>
            ))}
          </Grid>
        );

      case 'webAnalytics':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Plot
                data={[{
                  type: 'scatter',
                  mode: 'lines+markers',
                  x: ['Sessions', 'Active users', 'New users'],
                  y: [data['Sessions'], data['Active users'], data['New users']].map(v => v || 0)
                }]}
                layout={{ title: 'User Metrics' }}
              />
            </Grid>
            <Grid item xs={12}>
              <Plot
                data={[{
                  type: 'bar',
                  x: ['Engagement Time', 'Key Events', 'Revenue'],
                  y: [data['Average engagement time per session'], data['Key events'], data['Total revenue']].map(v => v || 0)
                }]}
                layout={{ title: 'Engagement Metrics' }}
              />
            </Grid>
          </Grid>
        );

      case 'socialMedia':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6">Facebook Metrics</Typography>
              <Plot
                data={[{
                  type: 'bar',
                  x: ['Reactions', 'Comments', 'Shares'],
                  y: [data['Reactions'], data['Comments'], data['Shares']].map(v => v || 0)
                }]}
                layout={{ title: 'Facebook Engagement' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6">Instagram Metrics</Typography>
              <Plot
                data={[{
                  type: 'bar',
                  x: ['Impressions', 'Clicks', 'Completions'],
                  y: [data['impressions'], data['clicks'], data['completions']].map(v => v || 0)
                }]}
                layout={{ title: 'Instagram Engagement' }}
              />
            </Grid>
          </Grid>
        );

      case 'campaignActivities':
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6">P2P Metrics</Typography>
              <Plot
                data={[{
                  type: 'bar',
                  x: ['Initial', 'Follow Ups', 'Responses', 'Opt Outs'],
                  y: [
                    data['p2p_initial_messages'],
                    data['p2p_follow_ups'],
                    data['p2p_responses'],
                    data['p2p_opt_outs']
                  ].map(v => v || 0)
                }]}
                layout={{ title: 'P2P Communication' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6">F2F Metrics</Typography>
              <Plot
                data={[{
                  type: 'bar',
                  x: ['Messages Sent', 'Phones Reached', 'Followed Up'],
                  y: [
                    data['f2f_initial_messages_sent'],
                    data['f2f_unique_phones_reached'],
                    data['f2f_contacts_followed_up_with']
                  ].map(v => v || 0)
                }]}
                layout={{ title: 'F2F Communication' }}
              />
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  const handleSubmit = async () => {
    try {
      // Reset any previous response
      setResponse(null);
      
      // Get campaign data
      const response = await axios.get('http://localhost:3000/campaigns/summary', {
        params: {
          campaign_tag: campaignTag,
          date: date
        }
      });

      // Process the response to ensure all fields are present
      const processedData = {};
      
      // Add all fields with their values or null
      Object.values(FIELD_CATEGORIES).forEach(category => {
        if (category.fields) {
          category.fields.forEach(field => {
            processedData[field] = response.data[field] || null;
          });
        }
        // Handle special cases like social media that have nested fields
        if (category.facebook) {
          category.facebook.forEach(field => {
            processedData[field] = response.data[field] || null;
          });
        }
        if (category.instagram) {
          category.instagram.forEach(field => {
            processedData[field] = response.data[field] || null;
          });
        }
        if (category.p2p) {
          category.p2p.forEach(field => {
            processedData[field] = response.data[field] || null;
          });
        }
        if (category.dialer) {
          category.dialer.forEach(field => {
            processedData[field] = response.data[field] || null;
          });
        }
        if (category.f2f) {
          category.f2f.forEach(field => {
            processedData[field] = response.data[field] || null;
          });
        }
        if (category.openCanvass) {
          category.openCanvass.forEach(field => {
            processedData[field] = response.data[field] || null;
          });
        }
      });

      setResponse(processedData);
    } catch (error) {
      setResponse({ error: error.response?.data?.error || 'Failed to fetch campaign data' });
    }
  };

  const renderMetricsCharts = () => {
    if (!response || response.error) return null;

    // Engagement metrics
    const engagementData = {
      x: ['Email Open Rate', 'Email Click Rate', 'CTV View Rate'],
      y: [response['Email Open Rate'], response['Email Click Rate'], response['CTV View Rate']],
      type: 'bar',
      name: 'Rates (%)',
      marker: { color: '#1976d2' }
    };

    // Reach metrics
    const reachData = {
      labels: ['FB Reach', 'IG Clicks', 'CTV Impressions', 'Mobilize RSVPs'],
      values: [
        response['FB Reach'],
        response['IG Clicks'],
        response['CTV Impressions'],
        response['Mobilize RSVPs']
      ],
      type: 'pie',
      hole: 0.4
    };

    return (
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Engagement Rates</Typography>
            <Plot
              data={[engagementData]}
              layout={{
                height: 400,
                margin: { t: 10, r: 10, l: 50, b: 50 },
                yaxis: { title: 'Rate (%)' }
              }}
              config={{ responsive: true }}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Reach Distribution</Typography>
            <Plot
              data={[reachData]}
              layout={{
                height: 400,
                margin: { t: 10, r: 10, l: 10, b: 10 }
              }}
              config={{ responsive: true }}
            />
          </Paper>
        </Grid>
      </Grid>
    );
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          MU Campaign Analytics
        </Typography>
        
        {/* Input Form */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                value={campaignTag}
                onChange={(e) => setCampaignTag(e.target.value)}
                placeholder="Enter campaign tag (e.g., MU Project 3.5)"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="date"
                variant="outlined"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button 
                variant="contained" 
                onClick={handleSubmit}
                fullWidth
                sx={{ height: '56px' }}
              >
                Get Summary
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {response && !response.error && (
          <Box sx={{ mt: 4 }}>
            {/* Category Tabs */}
            <Paper sx={{ mb: 3 }}>
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                variant="scrollable"
                scrollButtons="auto"
              >
                {Object.keys(FIELD_CATEGORIES).map((category, index) => (
                  <Tab 
                    key={category}
                    label={FIELD_CATEGORIES[category].title}
                    id={`tab-${index}`}
                  />
                ))}
              </Tabs>
            </Paper>

            {/* Category Content */}
            {Object.keys(FIELD_CATEGORIES).map((category, index) => (
              <div
                key={category}
                role="tabpanel"
                hidden={activeTab !== index}
              >
                {activeTab === index && (
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      {FIELD_CATEGORIES[category].title}
                    </Typography>
                    
                    {/* Category Data Table */}
                    <TableContainer component={Paper} sx={{ mb: 3 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Metric</TableCell>
                            <TableCell align="right">Value</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {FIELD_CATEGORIES[category].fields?.map(field => (
                            <TableRow key={field}>
                              <TableCell component="th" scope="row">{field}</TableCell>
                              <TableCell align="right">{response[field]}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Category Visualizations */}
                    {renderCategoryVisuals(category, response)}
                  </Paper>
                )}
              </div>
            ))}
          </Box>
        )}

        {response?.error && (
          <Box sx={{ mt: 4 }}>
            <Paper sx={{ p: 2, bgcolor: '#fff3f0' }}>
              <Typography color="error">{response.error}</Typography>
            </Paper>
          </Box>
        )}
      </Box>
    </Container>
  );
}

export default App;
