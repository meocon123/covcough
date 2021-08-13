variable "deploymentname" {}
variable "covcoughfile" {}
variable "covcoughhandler" {}
variable "processuploadimageurl" {}
variable "processuploadhandler" {}

variable "envvar" {
  type    = map(string)
  default = {}
}