import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

export class TablesConstruct extends Construct {
  public readonly rateLimitTable: dynamodb.Table;
  public readonly authTokenTable: dynamodb.Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.authTokenTable = new dynamodb.Table(this, "AuthTokenTable", {
      tableName: "AuthTokenTable",
      partitionKey: { name: "token", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.rateLimitTable = new dynamodb.Table(this, "RateLimitTable", {
      tableName: "RateLimitTable",
      partitionKey: { name: "token", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: "expiry",
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
  }
}
