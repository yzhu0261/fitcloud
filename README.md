# RepVelta

RepVelta is a serverless fitness tracking and nutrition management web application built on AWS.

## Planned Features

- User registration and authentication
- Workout tracking
- Exercise history and progress tracking
- Daily food logging
- Nutrition analysis, including calories and protein intake
- AI Fitness Coach with authenticated workout and nutrition tools

## Architecture

RepVelta uses a serverless AWS architecture with services including Amazon S3, CloudFront, Cognito, API Gateway, AWS Lambda, DynamoDB, CloudWatch, and IAM.

## AI Coach

The first AI Coach implementation is in `backend/ai-coach`. It uses the OpenAI Agents SDK inside AWS Lambda and exposes three read-only tools for recent workouts, recent nutrition, and seven-day progress.

Required Lambda environment variables:

- `FITNESS_API_BASE_URL`
- `OPENAI_API_KEY_SECRET_ARN`
- `OPENAI_MODEL`
- `ALLOWED_ORIGIN`

After deploying the Lambda behind a Cognito-protected API Gateway `POST /coach` route, copy the endpoint into `frontend/.env` as `VITE_AI_COACH_API_URL`.

### Build the Lambda package

```powershell
cd backend/ai-coach
npm install
npm run build
Compress-Archive -LiteralPath dist/index.cjs -DestinationPath dist/repvelta-ai-coach.zip -Force
```

Create a Node.js Lambda function and upload `dist/repvelta-ai-coach.zip` with these settings:

- Runtime: Node.js 20 or later
- Handler: `index.handler`
- Timeout: 30 seconds
- Memory: 512 MB

The Lambda execution role needs `secretsmanager:GetSecretValue` permission for only the configured OpenAI secret. The API Gateway route must use the existing Cognito JWT authorizer so the Lambda can safely forward the authenticated user's token to the workout and nutrition APIs.

![RepVelta AWS Architecture](docs/architecture/fitcloud-aws-architecture.png)
