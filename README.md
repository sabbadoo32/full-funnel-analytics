# Full Funnel Analytics Integration

This project integrates MongoDB campaign data with ChatGPT for advanced analytics and insights, designed for team collaboration through GitHub and GPT Teams.

## Project Structure

```
full_funnel/
├── full_funnel_api/     # Backend API
│   ├── routes/          # API routes
│   │   ├── campaigns.js # Campaign data endpoints
│   │   └── chatgpt.js   # ChatGPT integration
│   ├── models/          # MongoDB models
│   └── index.js         # Main server file
├── frontend/            # React frontend
└── docs/               # Project documentation
```

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   cd full_funnel_api
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in `full_funnel_api/` with:
   ```
   MONGO_URI=your_mongodb_uri
   OPENAI_API_KEY=your_openai_key
   API_KEY=your_openai_key
   PORT=3000
   ```

4. Start the server:
   ```bash
   node index.js
   ```

## API Endpoints

- `/campaigns` - Campaign data operations
- `/chatgpt/query` - ChatGPT integration with campaign data

## Team Collaboration

1. GitHub: Version control and code collaboration
2. MongoDB: Shared campaign data storage
3. ChatGPT: Analysis through GPT Teams
4. Documentation: Maintained in this repository

## Security Notes

- Never commit `.env` files or API keys
- Use environment variables for sensitive data
- Follow the `.gitignore` rules

## Development Workflow

1. Pull latest changes
2. Create feature branch
3. Make changes
4. Test locally
5. Create pull request
6. Review and merge

## Contact

For questions or access requests, contact the team lead.
