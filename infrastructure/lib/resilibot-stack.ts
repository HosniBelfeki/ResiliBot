import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class ResiliBotStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table for Incidents
    const incidentsTable = new dynamodb.Table(this, "IncidentsTable", {
      partitionKey: { name: "incidentId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "timestamp", type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    // S3 Buckets
    const runbooksBucket = new s3.Bucket(this, "RunbooksBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
    });

    const postmortemsBucket = new s3.Bucket(this, "PostmortemsBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Lambda Layer for shared dependencies
    const sharedLayer = new lambda.LayerVersion(this, "SharedLayer", {
      code: lambda.Code.fromAsset("../backend/layers/shared"),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_11],
      description: "Shared utilities and AWS SDK",
    });

    // IAM Role for Agent Lambda
    const agentRole = new iam.Role(this, "AgentRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
      ],
    });

    agentRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "bedrock:InvokeModel",
          "bedrock:InvokeAgent",
          "bedrock:Retrieve",
        ],
        resources: ["*"],
      })
    );

    agentRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:DescribeAlarms",
          "logs:FilterLogEvents",
          "logs:GetLogEvents",
        ],
        resources: ["*"],
      })
    );

    agentRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "ssm:SendCommand",
          "ssm:GetCommandInvocation",
          "ec2:DescribeInstances",
        ],
        resources: ["*"],
      })
    );

    agentRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["lambda:ListFunctions", "lambda:InvokeFunction"],
        resources: ["*"],
      })
    );

    // Ingestion Lambda
    const ingestionLambda = new lambda.Function(this, "IngestionLambda", {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: "ingestion.handler",
      code: lambda.Code.fromAsset("../backend/functions/ingestion"),
      environment: {
        INCIDENTS_TABLE: incidentsTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      layers: [sharedLayer],
    });

    // Grant ingestion lambda permission to list lambda functions (for discovery)
    ingestionLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["lambda:ListFunctions"],
        resources: ["*"],
      })
    );

    incidentsTable.grantWriteData(ingestionLambda);

    // Agent Orchestrator Lambda
    const agentLambda = new lambda.Function(this, "AgentLambda", {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: "agent.handler",
      code: lambda.Code.fromAsset("../backend/functions/agent"),
      role: agentRole,
      environment: {
        INCIDENTS_TABLE: incidentsTable.tableName,
        RUNBOOKS_BUCKET: runbooksBucket.bucketName,
        POSTMORTEMS_BUCKET: postmortemsBucket.bucketName,
        BEDROCK_MODEL_ID: "anthropic.claude-3-sonnet-20240229-v1:0",
      },
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      layers: [sharedLayer],
    });

    incidentsTable.grantReadWriteData(agentLambda);
    runbooksBucket.grantRead(agentLambda);
    postmortemsBucket.grantWrite(agentLambda);

    // Grant ingestion lambda permission to invoke agent lambda
    agentLambda.grantInvoke(ingestionLambda);

    // Pass agent lambda name to ingestion lambda
    ingestionLambda.addEnvironment(
      "AGENT_LAMBDA_NAME",
      agentLambda.functionName
    );

    // Tool Lambdas
    const ssmToolLambda = new lambda.Function(this, "SSMToolLambda", {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: "ssm_tool.handler",
      code: lambda.Code.fromAsset("../backend/functions/tools"),
      timeout: cdk.Duration.minutes(2),
      layers: [sharedLayer],
    });

    ssmToolLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "ssm:SendCommand",
          "ssm:GetCommandInvocation",
          "ec2:DescribeInstances",
        ],
        resources: ["*"],
      })
    );

    const notificationLambda = new lambda.Function(this, "NotificationLambda", {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: "notification.handler",
      code: lambda.Code.fromAsset("../backend/functions/tools"),
      environment: {
        SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL || "",
      },
      timeout: cdk.Duration.seconds(30),
      layers: [sharedLayer],
    });

    // Grant agent lambda permission to invoke notification lambda
    notificationLambda.grantInvoke(agentLambda);

    // API Gateway
    const api = new apigateway.RestApi(this, "ResiliBotAPI", {
      restApiName: "ResiliBot API",
      description: "API for ResiliBot incident management",
      deployOptions: {
        stageName: "prod",
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // API Resources
    const incidents = api.root.addResource("incidents");
    incidents.addMethod(
      "POST",
      new apigateway.LambdaIntegration(ingestionLambda)
    );
    incidents.addMethod("GET", new apigateway.LambdaIntegration(agentLambda));

    const incident = incidents.addResource("{incidentId}");
    incident.addMethod("GET", new apigateway.LambdaIntegration(agentLambda));
    
    // Add approval endpoint
    const approve = incident.addResource("approve");
    approve.addMethod("POST", new apigateway.LambdaIntegration(agentLambda));

    // EventBridge Rule for CloudWatch Alarms
    const alarmRule = new events.Rule(this, "AlarmRule", {
      eventPattern: {
        source: ["aws.cloudwatch"],
        detailType: ["CloudWatch Alarm State Change"],
        detail: {
          state: {
            value: ["ALARM"],
          },
        },
      },
    });

    alarmRule.addTarget(new targets.LambdaFunction(ingestionLambda));

    // Outputs
    new cdk.CfnOutput(this, "APIEndpoint", {
      value: api.url,
      description: "API Gateway endpoint URL",
    });

    new cdk.CfnOutput(this, "IncidentsTableName", {
      value: incidentsTable.tableName,
      description: "DynamoDB incidents table name",
    });

    new cdk.CfnOutput(this, "RunbooksBucketName", {
      value: runbooksBucket.bucketName,
      description: "S3 bucket for runbooks",
    });
  }
}
