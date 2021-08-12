variable "deploymentname" {}
variable "covcoughfile" {}
variable "covcoughhandler" {}
variable "processuploadfile" {}
variable "processuploadhandler" {}

variable "envvar" {
  type    = map(string)
  default = {}
}