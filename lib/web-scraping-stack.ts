import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as path from "path";

export class WebScrapingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const playwrightLayer = new lambda.LayerVersion(this, "PlaywrightLayer", {
      code: lambda.Code.fromAsset(path.join(__dirname, "../playwright-layer")),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
    });

    const scrollScrapingLambda = new lambda.Function(
      this,
      "ScollScrapingLambda",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromAsset(path.join(__dirname, "../lambda")),
        handler: "scroll-scraping.handler",
        layers: [playwrightLayer],
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
    scrollScrapingResource.addMethod("GET", scrollScrapingIntegration);
  }
}
