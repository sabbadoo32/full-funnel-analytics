# Base Node.js image
FROM node:20-slim

# Working directory
WORKDIR /usr/src/app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Ensure critical files are in place and readable
COPY full_funnel_instructions.txt /usr/src/app/full_funnel_instructions.txt
COPY full_funnel_all_columns_master_list.json /usr/src/app/full_funnel_all_columns_master_list.json

# Environment variables
ENV NODE_ENV=production
ENV INSTRUCTIONS_PATH=/usr/src/app/full_funnel_instructions.txt
ENV COLUMNS_PATH=/usr/src/app/full_funnel_all_columns_master_list.json

# Create views directory and copy template
RUN mkdir -p /usr/src/app/views
COPY views/chat.ejs /usr/src/app/views/

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/ || exit 1

# Start command
CMD ["node", "index.js"]
