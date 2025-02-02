import * as apigateway from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";

export class ApiGatewayConstruct extends Construct {
  public readonly api: apigateway.RestApi;

  constructor(
    scope: Construct,
    id: string,
    scrollScrapingLambda: apigateway.LambdaIntegration,
    authorizer: apigateway.TokenAuthorizer
  ) {
    super(scope, id);

    this.api = new apigateway.RestApi(this, "WebScrapingApi", {
      restApiName: "WebScrapingService",
    });

    const scrollScrapingResource = this.api.root.addResource("scroll-scraping");
    scrollScrapingResource.addMethod("GET", scrollScrapingLambda, {
      authorizationType: apigateway.AuthorizationType.CUSTOM,
      authorizer,
    });
  }
}
