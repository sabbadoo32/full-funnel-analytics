# Validation Utilities

This directory contains validation utilities for ensuring data integrity and schema compliance across the application.

## Available Validators

### BaseValidator

The base validation class that provides core validation functionality. All other validators extend this class.

### EmailAnalyticsValidator

A validator specifically for email analytics data, including:
- Query parameter validation for analytics endpoints
- Campaign data validation

## Usage

### Creating a New Validator

1. Create a new file in this directory (e.g., `MyValidator.js`)
2. Extend the `BaseValidator` class
3. Define your validation rules in the constructor
4. Add any custom validation methods as needed

Example:

```javascript
const BaseValidator = require('./BaseValidator');

class MyValidator extends BaseValidator {
  constructor() {
    super();
    
    this.rules = {
      username: {
        type: 'string',
        required: true,
        minLength: 3,
        maxLength: 30,
        validate: (value) => {
          if (!/^[a-zA-Z0-9_]+$/.test(value)) {
            return 'Username can only contain letters, numbers, and underscores';
          }
          return true;
        }
      },
      email: {
        type: 'email',
        required: true
      }
    };
    
    this.messages = {
      'username.required': 'Username is required',
      'email.invalid': 'Please provide a valid email address'
    };
  }
}

module.exports = MyValidator;
```

### Using Validators in Routes

Use the `createValidator` helper to create middleware for your routes:

```javascript
const express = require('express');
const { createValidator, EmailAnalyticsValidator } = require('./validators');

const router = express.Router();
const emailAnalyticsValidator = new EmailAnalyticsValidator();

// Validate query parameters
router.get('/analytics/email', 
  createValidator(emailAnalyticsValidator, { source: 'query' }),
  (req, res) => {
    // Access validated data
    const { campaignId, startDate, endDate } = req.validated.data;
    // ... handle the request
  }
);

// Validate request body
router.post('/campaigns',
  createValidator(emailAnalyticsValidator, { source: 'body', key: 'campaign' }),
  (req, res) => {
    // Access validated campaign data
    const campaignData = req.validated.campaign;
    // ... handle the request
  }
);
```

## Validation Rules

### Available Rule Options

- `type`: The expected data type (string, number, boolean, array, object, date, email, url)
- `required`: Whether the field is required (boolean)
- `default`: Default value if the field is not provided
- `validate`: Custom validation function that returns `true` if valid, or an error message if invalid
- `min`: Minimum value (for numbers) or length (for strings/arrays)
- `max`: Maximum value (for numbers) or length (for strings/arrays)
- `enum`: Array of allowed values
- `pattern`: Regular expression pattern the value must match (for strings)
- `items`: For arrays, the schema that all items must match
- `properties`: For objects, the schema of allowed properties

### Custom Validation

You can add custom validation logic by providing a `validate` function in your rule:

```javascript
this.rules = {
  password: {
    type: 'string',
    required: true,
    validate: (value) => {
      if (value.length < 8) {
        return 'Password must be at least 8 characters long';
      }
      if (!/[A-Z]/.test(value)) {
        return 'Password must contain at least one uppercase letter';
      }
      if (!/[0-9]/.test(value)) {
        return 'Password must contain at least one number';
      }
      return true;
    }
  }
};
```

## Error Handling

Validation errors are automatically caught and formatted with appropriate HTTP status codes (400 for validation errors). The error response includes:

- `success`: `false`
- `error`: Error message
- `details`: Object containing field-specific error messages

Example error response:

```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "email": ["Email is required"],
    "password": [
      "Password must be at least 8 characters long",
      "Password must contain at least one uppercase letter"
    ]
  }
}
```

## Best Practices

1. Keep validation rules close to where the data is used
2. Use specific error messages to help users understand what went wrong
3. Validate early - validate data as soon as it enters your application
4. Keep validation logic separate from business logic
5. Reuse validation rules where possible to maintain consistency
