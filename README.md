## Covcough

An application to determine if patient has Covid19 by analysing their cough sample via machine learning model developed by Dr Nguyen Dinh Son.

This application is NOT approved for covid test in any form. This application is made purely for research purposes. If you feel like you may have covid, please get a proper covid test done at nearest covid test site.


Details of the research is to be updated later (Maybe) :p

## Data collecting and testing

First version is purely to collect samples from patients. The steps require to test the audio sample against AI model is done manually. 

The next version will show the result from the AI model.

Below is an overview of the current setup:


```
  ┌────────────────────────────────┐           ┌───────────────────────────────────┐
  │                                │           │                                   │
  │   APIGateway.py                │           │ processupload.py                  │
  │                                │           │                                   │
  │   Generate presigned url to    │           │ Process uploaded records:         │
  │   upload records and retrieve  │           │   - Send notification to slack    │
  │   results.                     │           │   - Future: Run ML and return     │
  │                                │           │     result                        │
  └──────────────▲─────────────────┘           └───────────────▲───────────────────┘
                 │                                             │
                 │                                             │
                 │                                             │
                 1                                             3
                 │                                             │
                 │                                             │
                 │                                             │
  ┌──────────────┴──────────────┐                 ┌────────────┴──────────┐
  │                             ├────────2────────►                       │
  │                             │                 │  S3 bucket            │
  │    Git hub page - Frontend  │                 │    /records           │
  │        HTML/CSS/JS          │                 │    /results           │
  │                             ├────────4────────►                       │
  └─────────────────────────────┘                 └───────────────────────┘

1- Request presigned upload url
2- Upload record.wav to S3 bucket
3- S3 bucket CreatObject triggers processupload.py lambda to process record.wav
4- Frontend poll for result from S3 bucket every second
```

