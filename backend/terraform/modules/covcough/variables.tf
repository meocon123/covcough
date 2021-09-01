variable "deploymentname" {}
variable "covcoughfile" {}
variable "covcoughhandler" {}
variable "processuploadimageurl" {}

variable "apicustomdomain" {}
variable "apicustomdomaincertificatearn" {}

variable "envvar" {
  type    = map(string)
  default = {}
}