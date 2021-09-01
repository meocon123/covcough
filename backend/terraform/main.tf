
# A data source containing the lambda function for api gateway
data "archive_file" "apigateway" {
  source_file = "../code/apigateway.py"
  type = "zip"
  output_path = "../code/apigateway.zip"
}

# A data source containing the lambda function for api gateway
data "archive_file" "privateapigateway" {
  source_file = "../code/apigateway_private.py"
  type = "zip"
  output_path = "../code/apigateway_private.zip"
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

variable "apicustomdomain" {
  type = string
}
variable "apicustomdomaincertificatearn" {
  type = string
}


module "covcough" {
  source             = "./modules/covcough"
  deploymentname     = var.deploymentname
  covcoughfile    = "${data.archive_file.apigateway.output_path}"
  covcoughhandler = "apigateway.app_handler"
  processuploadimageurl    = var.processuploadimageurl
  apicustomdomain = var.apicustomdomain
  apicustomdomaincertificatearn = var.apicustomdomaincertificatearn
  envvar = {
    "APPURL"              = var.APPURL
    "SLACK_WEBHOOK"       = var.SLACK_WEBHOOK
  }
}

variable "privatedeployment" {
  type = string
}

variable "SIGNINGKEY" {
  type = string
}

variable "privateapicustomdomain" {
  type = string
}
variable "privateapicustomdomaincertificatearn" {
  type = string
}



module "private_covcough" {
  source             = "./modules/covcough"
  deploymentname     = var.privatedeployment
  covcoughfile    = "${data.archive_file.privateapigateway.output_path}"
  covcoughhandler = "apigateway_private.app_handler"
  processuploadimageurl    = var.processuploadimageurl
  apicustomdomain = var.privateapicustomdomain
  apicustomdomaincertificatearn = var.privateapicustomdomaincertificatearn
  envvar = {
    "APPURL"              = var.APPURL
    "SLACK_WEBHOOK"       = var.SLACK_WEBHOOK
    "SIGNINGKEY"          = var.SIGNINGKEY
    "DEBUG"               = "True"
  }
}

output "base_url" {
  value = module.covcough.base_url
}

output "private_base_url" {
  value = module.private_covcough.base_url
}
