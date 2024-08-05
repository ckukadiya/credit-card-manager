const jwt = require("jsonwebtoken");
const axios = require("axios");

const JWT_SECRET = process.env.JWT_SECRET;

// Simulate a user database for authentication
const users = [{ username: "user1", password: "password1" }];

exports.login = async (event) => {
  const { username, password } = JSON.parse(event.body);

  // Verify username and password
  const user = users.find(
    (u) => u.username === username && u.password === password
  );
  if (!user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Invalid credentials" }),
    };
  }

  // Generate JWT token
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "1h" });

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "origin, content-type, accept",
      "Access-Control-Allow-Methods": "POST, PUT, OPTIONS",
    },
    body: JSON.stringify({ token }),
  };
};

exports.getData = async (event) => {
  // Token is validated by the custom authorizer

  return {
    statusCode: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "origin, content-type, accept",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    },
    body: JSON.stringify({ data: "Protected data" }),
  };
};

exports.getToken = async (event) => {
  const {
    CREDIT_SERVICE_URL,
    CREDIT_SERVICE_USERNAME,
    CREDIT_SERVICE_PASSWORD,
  } = process.env;

  try {
    const response = await axios.post(CREDIT_SERVICE_URL, {
      username: CREDIT_SERVICE_USERNAME,
      password: CREDIT_SERVICE_PASSWORD,
    });
    console.log(response.data);
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "origin, content-type, accept",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
      body: JSON.stringify(response.data),
    };
  } catch (error) {
    console.error(error);
  }
};

exports.validateToken = async (event) => {
  console.log(event);
  const token = event.headers ? event.headers.Authorization : undefined;
  if (!token) {
    throw new Error("Unauthorized");
  }
  try {
    jwt.verify(token.replace("Bearer ", ""), JWT_SECRET);
    return {
      principalId: "user",
      policyDocument: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: "execute-api:Invoke",
            Effect: "Allow",
            Resource: event.methodArn,
          },
        ],
      },
    };
  } catch (error) {
    throw new Error("Unauthorized");
  }
};
