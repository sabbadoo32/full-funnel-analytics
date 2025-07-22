const validateDateRange = (req, res, next) => {
  const { start_time, end_time, start_date, end_date } = req.query;
  const startValue = start_time || start_date;
  const endValue = end_time || end_date;
  
  if (!startValue || !endValue) {
    return res.status(400).json({
      error: {
        code: 'INVALID_DATE_RANGE',
        message: 'Both start_time and end_time are required'
      }
    });
  }

  // Validate date format and range
  const startDate = new Date(startValue);
  const endDate = new Date(endValue);
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return res.status(400).json({
      error: {
        code: 'INVALID_DATE_FORMAT',
        message: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)'
      }
    });
  }

  if (startDate > endDate) {
    return res.status(400).json({
      error: {
        code: 'INVALID_DATE_RANGE',
        message: 'start_time must be before end_time'
      }
    });
  }

  next();
};

const validateAdAccountId = (req, res, next) => {
  const { adAccountId } = req.params;
  
  if (!adAccountId) {
    return res.status(400).json({
      error: {
        code: 'MISSING_AD_ACCOUNT_ID',
        message: 'Ad Account ID is required'
      }
    });
  }

  // Meta ad account IDs are numeric
  if (!/^\d+$/.test(adAccountId)) {
    return res.status(400).json({
      error: {
        code: 'INVALID_AD_ACCOUNT_ID',
        message: 'Invalid Ad Account ID format'
      }
    });
  }

  next();
};

module.exports = {
  validateDateRange,
  validateAdAccountId
};
