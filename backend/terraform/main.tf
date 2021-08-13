
# A data source containing the lambda function for api gateway
data "archive_file" "apigateway" {
  source_file = "../code/apigateway.py"
  type = "zip"
  output_path = "../code/apigateway.zip"
}

variable "processuploadimageurl" {
  type = string
}

variable "accountids" {
  type = list(string)
}


variable "deploymentname" {
  type = string
}

provider "aws" {
  version             = "~> 3.54.0"
  region              = "ap-southeast-1"
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
  processuploadimageurl    = var.processuploadimageurl
  processuploadhandler = "processupload.app_handler"
  envvar = {
    "APPURL"              = var.APPURL
    "SLACK_WEBHOOK"       = var.SLACK_WEBHOOK
  }
}

output "base_url" {
  value = module.covcough.base_url
}
