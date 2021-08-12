
# A data source containing the lambda function for api gateway
data "archive_file" "apigateway" {
  source_file = "../code/apigateway.py"
  type = "zip"
  output_path = "../code/apigateway.zip"
}


# A data source containing the lambda function for processing lambda
data "archive_file" "processupload" {
  source_file = "../code/processupload.py"
  type = "zip"
  output_path = "../code/processupload.zip"
}


variable "accountids" {
  type = list(string)
}


variable "deploymentname" {
  type = string
}

provider "aws" {
  version             = "~> 3.5.0"
  region              = "us-east-1"
  allowed_account_ids = var.accountids
}

variable "APPURL" {
    default="devmode"
}

variable "SLACK_WEBHOOK" {
    default="none"
}

module "covcough" {
  source             = "./modules/covcough"
  deploymentname     = var.deploymentname
  covcoughfile    = "${data.archive_file.apigateway.output_path}"
  covcoughhandler = "apigateway.app_handler"
  processuploadfile    = "${data.archive_file.processupload.output_path}"
  processuploadhandler = "processupload.app_handler"
  envvar = {
    "APPURL"              = var.APPURL
    "SLACK_WEBHOOK"       = var.SLACK_WEBHOOK
  }
}

output "base_url" {
  value = module.covcough.base_url
}
