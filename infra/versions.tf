terraform {
  required_version = ">= 1.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
  }

  # The S3 bucket and DynamoDB table below must exist before `terraform init`.
  # If you'd rather share infrastructure with the existing
  # portfolio-ihs-technology project, swap these for that bucket/table and
  # change `key` to a unique value (e.g. "amen-circle/terraform.tfstate").
  backend "s3" {
    bucket         = "amen-circle-tfstate"
    key            = "amen-circle/terraform.tfstate"
    region         = "eu-west-2"
    encrypt        = true
    dynamodb_table = "amen-circle-tfstate-lock"
  }
}

provider "aws" {
  region = "eu-west-2"
}

# Amplify only accepts custom certificates from us-east-1.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}
