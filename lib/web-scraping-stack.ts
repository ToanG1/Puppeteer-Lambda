import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { AuthorizerLambdaConstruct } from "./AuthorizerLambdaConstruct";
import { ApiGatewayConstruct } from "./ApiGatewayConstruct";
import { RateLimitTableConstruct } from "./RateLimitTableConstruct";
import { ScrollScrapingLambdaConstruct } from "./ScrollScrapingLambdaConstruct";
import { SecretConstruct } from "./SecretConstruct";

export class WebScrapingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const authorizerLambdaConstruct = new AuthorizerLambdaConstruct(
      this,
      "AuthorizerLambdaConstruct"
    );
    const secretConstruct = new SecretConstruct(this, "SecretConstruct");
    const rateLimitTableConstruct = new RateLimitTableConstruct(
      this,
      "RateLimitTableConstruct"
    );

    secretConstruct.secret.grantRead(
      authorizerLambdaConstruct.authorizerLambda
    );
    rateLimitTableConstruct.rateLimitTable.grantReadWriteData(
      authorizerLambdaConstruct.authorizerLambda
    );

    const scrollScrapingLambdaConstruct = new ScrollScrapingLambdaConstruct(
      this,
      "ScrollScrapingLambdaConstruct"
    );

    new ApiGatewayConstruct(
      this,
      "ApiGatewayConstruct",
      new apigateway.LambdaIntegration(
        scrollScrapingLambdaConstruct.scrollScrapingLambda
      ),
      authorizerLambdaConstruct.authorizer
    );
  }
}
