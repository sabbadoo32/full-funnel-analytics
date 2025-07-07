// Marketing Analytics Widget
(function() {
  // Widget styles
  const styles = `
    .ma-widget {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .ma-chat-input {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    .ma-chat-history {
      max-height: 400px;
      overflow-y: auto;
      padding: 10px;
      border: 1px solid #eee;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    .ma-message {
      margin: 8px 0;
      padding: 8px;
      border-radius: 4px;
    }
    .ma-user-message {
      background: #e3f2fd;
      margin-left: 20px;
    }
    .ma-bot-message {
      background: #f5f5f5;
      margin-right: 20px;
    }
    .ma-viz {
      width: 100%;
      min-height: 400px;
      margin: 10px 0;
    }
  `;

  // Add styles to document
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  // Load required scripts
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Widget class
  class MarketingAnalyticsWidget {
    constructor(container) {
      this.container = container;
      this.chatHistory = [];
      // Get backend URL from data attribute or fallback to default
      this.backendUrl = container.getAttribute('data-backend-url') || 'http://localhost:3000';
      
      // Ensure HTTPS for non-localhost URLs
      if (!this.backendUrl.includes('localhost') && this.backendUrl.startsWith('http:')) {
        this.backendUrl = this.backendUrl.replace('http:', 'https:');
      }
      this.init();
    }

    async init() {
      // Load dependencies
      await Promise.all([
        loadScript('https://cdn.plot.ly/plotly-latest.min.js'),
        loadScript('https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js')
      ]);

      this.render();
      this.attachEventListeners();
    }

    render() {
      this.container.innerHTML = `
        <div class="ma-widget">
          <div class="ma-chat-history"></div>
          <div class="ma-viz"></div>
          <input type="text" class="ma-chat-input" placeholder="Ask about your marketing data...">
        </div>
      `;

      this.chatHistoryEl = this.container.querySelector('.ma-chat-history');
      this.vizEl = this.container.querySelector('.ma-viz');
      this.inputEl = this.container.querySelector('.ma-chat-input');
    }

    attachEventListeners() {
      this.inputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleQuery(e.target.value);
          e.target.value = '';
        }
      });
    }

    async handleQuery(query) {
      // Add user message to chat
      this.addMessage(query, 'user');

      // Handle Netlify Functions URL structure
      let apiEndpoint = this.backendUrl;
      
      // Remove trailing slash if present
      if (apiEndpoint.endsWith('/')) {
        apiEndpoint = apiEndpoint.slice(0, -1);
      }
      
      // Add the correct path based on whether the URL already includes the Netlify functions path
      if (apiEndpoint.includes('.netlify/functions/api')) {
        // If URL already has the Netlify functions path, just add the chat query endpoint
        if (!apiEndpoint.endsWith('/chat/query')) {
          apiEndpoint = `${apiEndpoint}/chat/query`;
        }
      } else {
        // If URL doesn't have the Netlify functions path, add the complete path
        apiEndpoint = `${apiEndpoint}/.netlify/functions/api/chat/query`;
      }
      
      console.log('Using API endpoint:', apiEndpoint);

      try {
        const response = await axios.post(apiEndpoint, {
          message: query
        });

        const { answer, visualization } = response.data;

        // Add bot response to chat
        this.addMessage(answer, 'bot');

        // Update visualization if provided
        if (visualization) {
          Plotly.newPlot(this.vizEl, visualization.data, visualization.layout);
        }
      } catch (error) {
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          endpoint: apiEndpoint
        });
        this.addMessage(`Error: ${error.response?.data?.error || error.message || 'Unknown error'}`, 'bot');
      }
    }

    addMessage(text, type) {
      const messageEl = document.createElement('div');
      messageEl.className = `ma-message ma-${type}-message`;
      messageEl.textContent = text;
      this.chatHistoryEl.appendChild(messageEl);
      this.chatHistoryEl.scrollTop = this.chatHistoryEl.scrollHeight;
    }
  }

  // Initialize widget
  const containers = document.querySelectorAll('#marketing-analytics-widget');
  containers.forEach(container => new MarketingAnalyticsWidget(container));
})();
