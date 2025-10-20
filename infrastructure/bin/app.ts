#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ResiliBotStack } from '../lib/resilibot-stack';

const app = new cdk.App();

new ResiliBotStack(app, 'ResiliBotStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: 'ResiliBot - Autonomous Incident Response Agent',
});

app.synth();
