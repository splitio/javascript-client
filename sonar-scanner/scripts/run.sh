#!/bin/bash

AUTH_TOKEN=$1
COMMIT=$2
REPO_OWNER=$3
REPO_NAME=$4
SCANNER=./sonar-scanner/bin/sonar-scanner

java -jar ./sonar-scanner/lib/codedeploy-sonar-all.jar -authtoken $AUTH_TOKEN -commit $COMMIT -repoowner $REPO_OWNER -reponame $REPO_NAME -scanner $SCANNER

