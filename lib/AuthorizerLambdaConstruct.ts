import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as path from "path";
import { Construct } from "constructs";

export class AuthorizerLambdaConstruct extends Construct {
  public readonly authorizer: apigateway.TokenAuthorizer;
  public readonly authorizerLambda: lambda.Function;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.authorizerLambda = new lambda.Function(this, "AuthorizerLambda", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda/auth")),
    });

    this.authorizer = new apigateway.TokenAuthorizer(this, "MyAuthorizer", {
      handler: this.authorizerLambda,
    });
  }
}
