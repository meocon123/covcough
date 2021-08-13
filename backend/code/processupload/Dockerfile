# Pull the base image with python 3.8 as a runtime for your Lambda
FROM public.ecr.aws/lambda/python:3.8

RUN yum -y install libsndfile

# Copy the earlier created requirements.txt file to the container
COPY requirements.txt ./

# Install the python requirements from requirements.txt
RUN python3.8 -m pip install -r requirements.txt

# Copy training model
COPY Early_alexnet64x64_AIVN_val_loss.hdf5 ./

# Copy a test file
COPY test.wav ./

# Copy the main app.py file to the container
COPY app.py ./


# Set the CMD to your handler
CMD ["app.lambda_handler"]