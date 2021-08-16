variable "deploymentname" {}
variable "covcoughfile" {}
variable "covcoughhandler" {}
variable "processuploadimageurl" {}
variable "processuploadhandler" {}

variable "apicustomdomain" {}
variable "apicustomdomaincertificatearn" {}

variable "envvar" {
  type    = map(string)
  default = {}
}