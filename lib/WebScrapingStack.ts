import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { AuthorizerLambdaConstruct } from "./AuthorizerLambdaConstruct";
import { ApiGatewayConstruct } from "./ApiGatewayConstruct";
import { TablesConstruct } from "./TablesConstruct";
import { ScrollScrapingLambdaConstruct } from "./ScrollScrapingLambdaConstruct";

export class WebScrapingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const authorizerLambdaConstruct = new AuthorizerLambdaConstruct(
      this,
      "AuthorizerLambdaConstruct"
    );
    const tablesConstruct = new TablesConstruct(this, "TablesConstruct");

    tablesConstruct.rateLimitTable.grantReadWriteData(
      authorizerLambdaConstruct.authorizerLambda
    );

    tablesConstruct.authTokenTable.grantReadWriteData(
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
