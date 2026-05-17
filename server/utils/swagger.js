import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PulseChat API',
      version: '1.0.0',
      description: 'Real-time messaging application API documentation',
      contact: {
        name: 'PulseChat Support',
        url: 'https://pulsechat.example.com',
        email: 'support@pulsechat.example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:5000',
        description: 'Development Server',
      },
      {
        url: 'https://api.pulsechat.example.com',
        description: 'Production Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme',
        },
      },
      schemas: {
        User: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            _id: {
              type: 'string',
              description: 'User unique identifier',
              example: '507f1f77bcf86cd799439011',
            },
            name: {
              type: 'string',
              description: 'User full name',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john@example.com',
            },
            avatar: {
              type: 'string',
              description: 'User avatar URL',
              example: 'https://api.example.com/avatars/507f1f77bcf86cd799439011.jpg',
            },
            isOnline: {
              type: 'boolean',
              description: 'User online status',
              example: true,
            },
            lastSeen: {
              type: 'string',
              format: 'date-time',
              description: 'Last seen timestamp',
              example: '2024-01-15T10:30:00Z',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
              example: '2024-01-01T00:00:00Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last profile update timestamp',
              example: '2024-01-15T10:30:00Z',
            },
          },
        },
        Message: {
          type: 'object',
          required: ['conversationId', 'senderId', 'content'],
          properties: {
            _id: {
              type: 'string',
              description: 'Message unique identifier',
            },
            conversationId: {
              type: 'string',
              description: 'Conversation ID',
            },
            senderId: {
              type: 'string',
              description: 'ID of the message sender',
            },
            content: {
              type: 'string',
              description: 'Message content',
              minLength: 1,
              maxLength: 5000,
            },
            attachments: {
              type: 'array',
              description: 'Message attachments',
              items: {
                type: 'object',
                properties: {
                  url: {
                    type: 'string',
                  },
                  type: {
                    type: 'string',
                  },
                },
              },
            },
            isEdited: {
              type: 'boolean',
              description: 'Whether message has been edited',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Message creation timestamp',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Conversation: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Conversation unique identifier',
            },
            participants: {
              type: 'array',
              description: 'List of participant user IDs',
              items: {
                type: 'string',
              },
            },
            lastMessage: {
              type: 'string',
              description: 'ID of the last message',
            },
            isGroup: {
              type: 'boolean',
              description: 'Whether this is a group conversation',
            },
            name: {
              type: 'string',
              description: 'Group name (if group conversation)',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            statusCode: {
              type: 'integer',
              description: 'HTTP status code',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Error timestamp',
            },
          },
        },
        TokenResponse: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              description: 'JWT access token',
            },
            refreshToken: {
              type: 'string',
              description: 'JWT refresh token',
            },
            expiresIn: {
              type: 'integer',
              description: 'Token expiration time in seconds',
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: [
    './server/routes/authRoutes.js',
    './server/routes/userRoutes.js',
    './server/routes/messageRoutes.js',
    './server/routes/conversationRoutes.js',
  ],
};

export default swaggerJsdoc(options);
