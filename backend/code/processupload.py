## This lambda trigger on every createobject. Using this lambda, we can execute trained model against uploaded audio record and put result into /results folder under the same s3 bucket.

import boto3
import sys
import hashlib
import time
import secrets
import os
import json
import re
import datetime
import urllib.request
from urllib.parse import urlsplit, urlunsplit

SLACK_URL = os.getenv('SLACK_WEBHOOK')
APIGATEWAY_LAMBDA = os.getenv('APIGATEWAY_LAMBDA')

def nofify_slack(payload):
    headers = {'Content-type': 'application/json'}
    data = json.dumps(payload).encode('utf-8') 
    req = urllib.request.Request(SLACK_URL, data, headers)
    resp = urllib.request.urlopen(req)
    return resp


def getobj(bkt,key):
    print(bkt)
    print(key)
    s3 = boto3.client('s3')
    response = s3.head_object(Bucket=bkt, Key=key)
    # exp = datetime.datetime.strptime(expstr,'%d %b %Y %H:%M:%S %Z')  
    objsize = response['ContentLength']
    objname = ""
    try:
        filemetadata = json.loads(response['ResponseMetadata']['HTTPHeaders']['x-amz-meta-tag'])
        objname = filemetadata["name"]
    except:
        objname = "unknown-file-name"
    downloadurl = APIGATEWAY_LAMBDA+"/download/"+key
    return {
        "downloadurl":downloadurl,
        "bucket":bkt,
        "objkey":key,
        "objsize":objsize,
        "tag_filename": objname,
    }

## Handler for s3 create object event!
def app_handler(event, context):
    print(context.invoked_function_arn)
    objkey=event['Records'][0]['s3']['object']['key']
    info=getobj(event['Records'][0]['s3']['bucket']['name'],event['Records'][0]['s3']['object']['key'])
    msg='''
A new record was received. This file will expire in 10 days:
```
{}
```
    '''.format(json.dumps(info, indent=4, sort_keys=True))
    
    payload = {
                    "icon_emoji": ":card_file_box:",
                    "username": "relaysecret",
                    "text": msg
                }
    nofify_slack(payload)
    