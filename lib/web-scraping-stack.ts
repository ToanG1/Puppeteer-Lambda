import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as path from "path";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

export class WebScrapingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const authorizerLambda = new lambda.Function(this, "AuthorizerLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/auth")),
    });

    const authorizer = new apigateway.TokenAuthorizer(this, "MyAuthorizer", {
      handler: authorizerLambda,
    });

    const secret = new secretsmanager.Secret(this, "AuthSecret", {
      secretName: "WebScrapingAuthToken",
      generateSecretString: {
        secretStringTemplate: JSON.stringify({}),
        generateStringKey: "token",
        passwordLength: 32,
        excludeCharacters: '"@/\\',
      },
    });

    secret.grantRead(authorizerLambda);

    const scrollScrapingLambda = new lambda.Function(
      this,
      "ScollScrapingLambda",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromAsset(
          path.join(__dirname, "../lambda/scroll-scraping")
        ),
        handler: "index.handler",
        memorySize: 1024,
        timeout: cdk.Duration.seconds(45),
      }
    );

    const api = new apigateway.RestApi(this, "WebScrapingApi", {
      restApiName: "WebScrapingService",
    });

    const scrollScrapingIntegration = new apigateway.LambdaIntegration(
      scrollScrapingLambda
    );

    const scrollScrapingResource = api.root.addResource("scroll-scraping");
    scrollScrapingResource.addMethod("GET", scrollScrapingIntegration, {
      authorizationType: apigateway.AuthorizationType.CUSTOM,
      authorizer,
    });
  }
}
