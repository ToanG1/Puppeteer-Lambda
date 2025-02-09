const AWS = require("aws-sdk");

const secretsManager = new AWS.SecretsManager();
const dynamoDB = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = "RateLimitTable";
const REQUEST_LIMIT = 100;

exports.handler = async function (event) {
  try {
    const secretData = await secretsManager
      .getSecretValue({ SecretId: "WebScrapingAuthToken" })
      .promise();
    const secret = JSON.parse(secretData.SecretString);
    const expectedToken = secret.token;

    const token = event.authorizationToken?.replace("Bearer ", "");

    if (token !== expectedToken) {
      return generatePolicy("Deny", event.methodArn);
    }

    const { requestCount, expiry } = await getRequestCount(token);

    if (requestCount >= REQUEST_LIMIT) {
      return generatePolicy("Deny", event.methodArn);
    }

    await incrementRequestCount(token, expiry);

    return generatePolicy("Allow", event.methodArn);
  } catch (error) {
    return generatePolicy("Deny", event.methodArn);
  }
};

async function getRequestCount(token) {
  const params = {
    TableName: TABLE_NAME,
    Key: { token },
  };
  const result = await dynamoDB.get(params).promise();
  const item = result.Item || { requestCount: 0, expiry: getNextResetTime() };

  return item;
}

async function incrementRequestCount(token, expiry) {
  const params = {
    TableName: TABLE_NAME,
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
