const AWS = require("aws-sdk");

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const AUTH_TABLE = "AuthTokenTable";
const RATE_LIMIT_TABLE = "RateLimitTable";
const REQUEST_LIMIT = 500;

exports.handler = async function (event) {
  try {
    const token = event.authorizationToken?.replace("Bearer ", "");

    if (!token) {
      return generatePolicy("Deny", event.methodArn);
    }

    const isValidToken = await validateToken(token);
    if (!isValidToken) {
      return generatePolicy("Deny", event.methodArn);
    }

    const { requestCount, expiry } = await getRequestCount(token);
    if (requestCount >= REQUEST_LIMIT) {
      return generatePolicy("Deny", event.methodArn);
    }

    await incrementRequestCount(token, expiry);

    return generatePolicy("Allow", event.methodArn);
  } catch (error) {
    console.error("Error:", error);
    return generatePolicy("Deny", event.methodArn);
  }
};

async function validateToken(token) {
  const params = {
    TableName: AUTH_TABLE,
    Key: { token },
  };
  const result = await dynamoDB.get(params).promise();
  return result.Item ? true : false;
}

async function getRequestCount(token) {
  const params = {
    TableName: RATE_LIMIT_TABLE,
    Key: { token },
  };
  const result = await dynamoDB.get(params).promise();
  return result.Item || { requestCount: 0, expiry: getNextResetTime() };
}

async function incrementRequestCount(token, expiry) {
  const params = {
    TableName: RATE_LIMIT_TABLE,
    Key: { token },
    UpdateExpression:
      "SET requestCount = if_not_exists(requestCount, :start) + :incr, expiry = :exp",
    ExpressionAttributeValues: {
      ":start": 0,
      ":incr": 1,
      ":exp": expiry,
    },
  };
  await dynamoDB.update(params).promise();
}

function generatePolicy(effect, resource) {
  return {
    principalId: "user",
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };
}

function getNextResetTime() {
  const now = new Date();
  now.setHours(24, 0, 0, 0);
  return Math.floor(now.getTime() / 1000);
}
