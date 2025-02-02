import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

export class SecretConstruct extends Construct {
  public readonly secret: secretsmanager.Secret;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.secret = new secretsmanager.Secret(this, "AuthSecret", {
      secretName: "WebScrapingAuthToken",
      generateSecretString: {
        secretStringTemplate: JSON.stringify({}),
        generateStringKey: "token",
        passwordLength: 32,
        excludeCharacters: '"@/\\',
      },
    });
  }
}
