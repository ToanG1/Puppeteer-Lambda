import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import { Construct } from "constructs";

export class ScrollScrapingLambdaConstruct extends Construct {
  public readonly scrollScrapingLambda: lambda.Function;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.scrollScrapingLambda = new lambda.Function(
      this,
      "ScrollScrapingLambda",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromAsset(
          path.join(__dirname, "../lambda/scroll-scraping")
        ),
        handler: "index.handler",
        memorySize: 1536,
        timeout: cdk.Duration.seconds(45),
      }
    );
  }
}
