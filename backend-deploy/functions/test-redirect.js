exports.handler = async function(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Redirect test successful",
      path: event.path,
      httpMethod: event.httpMethod,
      headers: event.headers
    })
  };
};
