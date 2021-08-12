import boto3
import sys
import hashlib
import time
import secrets
import os
import json
import datetime
import urllib.request
from urllib.parse import urlsplit, urlunsplit
from botocore.client import Config

# Change BUCKET_NAME to your bucket name and
# KEY_NAME to the name of a file in the directory where you'll run the curl command.
# This backend can be easily tweaked to support multiple regions to conform with GDPR data storage requirement


bkt = os.getenv('BUCKETNAME',None)
awsregion = "us-east-1"
seed = os.environ['SEED']
appurl = os.environ['APPURL']

# Set the max object size.. (200mb)
maxobjectsize = 200000000

# getposturl generate request to create a pre-signed POST for uploading data to S3 for recording
def getposturl(filename):
    print("Generate post url!")
    s3 = boto3.client('s3',config=Config(region_name=awsregion, signature_version='s3v4'))
    fields = {
            "acl": "private",
            }
    conditions = [
        {"acl": "private"},
        {"content-type":"audio/wav"},
        ["content-length-range", 1, maxobjectsize],
        ["starts-with", "$x-amz-meta-tag", ""]
    ]

    keyname = "records/{filename}.wav".format(filename=filename)

    return s3.generate_presigned_post(Bucket=bkt,Key=keyname,Fields=fields,Conditions=conditions)

# getobj generate link to download /results/{sha256}.img
def getobj(key):
    s3 = boto3.client('s3', config=Config(region_name=awsregion, signature_version='s3v4'))
    # response = s3.head_object(Bucket=bkt, Key=key)
    # objsize = response['ContentLength']
    # objname = ""
    # try:
    #     filemetadata = json.loads(response['ResponseMetadata']['HTTPHeaders']['x-amz-meta-tag'])
    #     objname = filemetadata["name"]
    # except:
    #     objname = "unknown"
    return {
        "signedurl": s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': bkt,
            'Key': key},
            ExpiresIn=3600
        )
    }


# main lambda app_handler function. see this url for references
#https://www.serverless.com/framework/docs/providers/aws/events/apigateway/#example-lambda-proxy-event-default
def app_handler(event, context):
    global bkt
    global awsregion
    print ("Starting lambda")
    try:
        referer = event["headers"]["Referer"]
    except Exception as e: 
        print(e)
        referer = ""
    path = event["path"]
    # In prod, we will exit and return 200ok
    if (appurl != "devmode" and not referer.startswith(appurl)):
        return {
        "statusCode": 200,
        "body"  : 'ok'
    }   
    print("Target bucket is {}".format(bkt))
    split_url = urlsplit(referer)
    clean_path = split_url.scheme+"://"+split_url.netloc 
    headers = {
        'Access-Control-Allow-Origin': clean_path,
        'Content-Type': "application/json"
    }
    statuscode = 404
    body = {"status_code":404}
    if path.startswith("/upload"):
        print("fileupload request received")
        try:    
            # generate a random filename to prevent bruteforce ;).
            random = seed+str(time.time())+str(secrets.randbits(256))
            h = hashlib.sha256()
            h.update(random.encode("utf-8"))
            filename = h.hexdigest()
            print("Generate filename {}".format(filename))
            body = getposturl(filename)
            statuscode = 200
        except Exception as e: 
            print(e)
            pass

    elif path.startswith("/getfile"):
        print("getfile request received")
        try:
            body = getobj(path[9:]) 
            statuscode = 200
        except Exception as e: 
            print(e)
            body = {"status_code":404}
            statuscode = 404 
    elif path.startswith("/download"):
        print("download request received")
        try:
            s3obj = getobj(path[10:]) 
            headers["Location"]=s3obj["signedurl"]
            statuscode = 301
        except Exception as e: 
            print(e)
            body = {"status_code":404}
            statuscode = 404 
    return {
        "statusCode": statuscode,
        "headers": headers,
        "body"  : json.dumps(body)
    }  




# Our debug main - We use this to test things locally as it's not used by lambda function.
if __name__ == '__main__':
    ### Form a POST curl request that would let me upload an image to relaysecret bucket.
    try:
        expiretime=int(sys.argv[1])
    except:
        expiretime=5
    # resp=getposturl(expiretime)
    # resp=gettunnelposturl("30a5ee6a97ff71e4")
    # print(resp)
    # resp['fields']['file'] = '@{key}'.format(key="kb.txt")
    # form_values = "  ".join(["-F {key}={value} ".format(key=key, value=value)
    #                     for key, value in resp['fields'].items()])
    # # Construct a curl command to upload an image kb.jpg file to S3 :) 
    # print('curl command: \n')
    # print('curl -v -F "x-amz-meta-tag=test" -F content-type=text/plain {form_values} {url}'.format(form_values=form_values, url=resp['url']))
    print(gettunnellist("30a5ee6a97ff71e4"))
    print(getobj("1day/30a5ee6a97ff71e4/cd940555754b33582d5445972f62eb6ef14eef617670c8e73251925a87ce20a1"))
    # print('')

    # Check Sha1 for eicar file.
    # print(json.dumps(checkvirus("3395856ce81f2b7382dee72602f798b642f14140")))
    
    