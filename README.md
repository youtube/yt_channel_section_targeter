# YouTube Channel Section Targeter

**This is not an official Google product.**

## Index

-   [Background](#background)
-   [Project objective](#project-objective)
-   [Setup](#setup)
    -   [Publish a web app using App
        Script](#publish-a-web-app-using-app-script)
    -   [Setup a simple Google App Engine
        project](#setup-a-simple-google-app-engine-project)
    -   [Setup your own hosting](#setup-your-own-hosting)
-   [Technical details](#technical-details)
-   [FAQ](#faq)

## Background

[Channel sections](https://support.google.com/youtube/answer/3027787?hl=en) is a
feature in YouTube that allows you to customize the layout of your channel's
homepage.

As an advanced feature, you can set targeting options on your channel sections
so only certain users can see the section. Available targeting options are:
*language*, *country* and *region*. This feature makes it possible to maintain a
global channel with targeted channel sections instead of having individual
channels for different languages/countries/regions.

This advanced feature, however, is not available through the YouTube website
user interface and only accessible through API. More details can be found on the
[Google Developers
website](https://developers.google.com/youtube/v3/docs/channelSections).

## Project objective

This tool allows you to quickly setup a web UI to manage targeting settings of
channel sections in your YouTube channel.

## Setup

You need to deploy the code to a web server to use it. Here are some methods
including instructions. You may find related code under *example/*.

* **Publish a web app using App Script** (30 mins, less technical)
* **Setup a simple App Engine project** (30 mins)
* **Setup your own hosting** for more technical users

### Publish a web app using App Script

#### 1 - Copy the sample project

Make a copy of the [sample
project](https://script.google.com/d/1RvfjHgevFFl3FnG8QMKbmGXd_azVpFBt-r94J1QzNdGcj0PNa96dHvkS/edit?usp=sharing)
from the *File* menu then *Make a copy*. Be careful of sharing settings so only
relevant users/groups have access. Sharing settings are accessible through
*File*, then *Share*.

#### 2 - Enable API & get the OAuth Client ID

Click *Resources*, then *Cloud Platform project*. On the prompted dialog, click
the project link highlighted in blue. This brings you to the associated
project's control panel.

On the left, click *Library* and find *YouTube Data API* on the right. Click
it and then click *Enable* on top.

On the left of the website, click *Credentials* and copy the *Client ID*
shown on the right with the format "xxxx-xxxxxxxx.apps.googleusercontent.com".
**Keep this window open for later use**.

Back to the copied App Script project. Open the file *script.html* on the left
panel. Locate the placeholder for OAUTH2_CLIENT_ID in top lines of the file and
replace its value with the value you just copied.

#### 3 - Deploy the web app

Click on *Publish*, then click on *Deploy as web app*. Click *Deploy* or
*Update* and you will get the external link to the tool. **Remember** to set
*Execute the app as* to *User accessing the web app*. If you want others to have
access to the tool, change Who has access to the app* to **Anyone**.

#### 4 - Add origin URL to authorization list

You now need a final step to setup the authentication. Visit the tool via the
link you found in the previous step, click *Authorize* button and you should see
a pop up with error messages. Press Ctrl+F and type *parameters. origin*, you
should find the line *parameters.origin:
https://some-random-characters-script.googleusercontent.com*. Copy the URL
including "https".

Now switch back to the Cloud Platform website opened on step 2. Click the only
item on the Credentials list (the name should be *Apps Script*), paste the URL
in the field under *Authorized JavaScript origins*. Click *Save*.

#### 5 - You are all set

The tool is now setup. Refresh the page and you should be able to authenticate
now.

Besides copying the sample project, you can also setup your own App Script
project from scratch with the help of code under *example/app_script/*.


### Setup a simple Google App Engine project

**Note:** This setup requires some basic technical skills.

#### 1 - Create a App Engine project

Follow the steps listed on [Quickstart for Python App Engine Standard
Environment](https://cloud.google.com/appengine/docs/standard/python/quickstart)
to create a new App Engine application and setup the Google Cloud SDK. Note down
the *Project ID* as we'll need it afterwards.

#### 2 - Enable API & create OAuth Client ID

On the Cloud Console website, click the menu on top right and open
*API Manager*. Click *ENABLE API* and find *YouTube Data API*, enable it.

Also open the *Credentials* page on the left panel, click on *Create
credentials*, select *OAuth client ID*, select *Web application*. Follow the
instructions to add a product name. Then, add
*https://**your_project_ID**.appspot.com* to the *Authorized JavaScript origins*
list and click *Create*. You may also modify these settings later. Copy the
*Client ID* since we'll need it later.

#### 3 - Download the code and configure

Download or clone the source code of this project. Open the
*example/app_engine/static/channel_targeter.js* and locate the placeholder for
*OAUTH2_CLIENT_ID* on the top. Replace the value in quotes to the *Client ID*
you just created.

#### 4 - Deploy the project to App Engine

Open a terminal. Change directory to *example/app_engine/* and execute

> gcloud app deploy app.yaml --project **your_project_id**

This will deploy the code to your App Engine application.

#### 5 - You are all set

You should now be able to use the tool by visiting
*https://**your_project_ID**.appspot.com/*

Note that by default only you have access to the tool. To set access, go to
*IAM & Admin* on the Cloud Console website and add accounts.

### Setup your own hosting

If you need more control or have more specific requirements You can surely setup
a webserver serving these files. Be sure to setup correct relative paths. For
frameworks like Django be careful that the template symbole {{}} might bring
confliction with AngularJS.

Also, you need to create a project in Google Cloud Platform, obtain a valid
OAuth2 Client ID and put it in the script. You also need to add your website's
URL in the *Authorized JavaScript origins* list on the Google Cloud Platform
website.

## Technical details

This UI and the logic of the tool is programmed using AngularJS v1 and Angular
Material.

Interaction with YouTube is done via the [YouTube Data API
v3](https://developers.google.com/youtube/v3/docs/). The API may have limitation
and may evolve over time so in case of problems, please refer to the official
documentation.

Authentication of the tool is done using Google API Client which adopts standard
OAuth 2.0 sign-in. As a requirement for Google API Client you have to setup a
web server to serve the tool.

## FAQ

### Does it work with brand channels and content owner accounts?

Yes. For brand channels, just choose the right channel in the authentication
process. For CMS accounts, sign in with the account that has access to the CMS.

In both cases, be careful to use the correct channel ID.

### Does the code work on local file system?

No. Due to security concerns, you cannot authorize API calls when the request
is issued from local file system. You'll have to use a web server, which could
work on localhost or remote hosts.

### I have authentication problem saying "Origin mismatch", what do I do?

This problem is likely due to that the OAuth Client ID is not correctly set.
You need to have a valid client ID of your own and add the website URL to the
*Authorized JavaScript origins* field of the ID.

Also note that after setting the field, it might take several minutes for the
change to be effective.

If you setup your project using App Script, the URL might also change with
different versions, you can repeat the step 4 to find the correct URL to add to
the allowed origins list.

### I get strange errors and the tool does not work anymore.

There could be a bug or a change on the API that broke the tool. If the issue is
identified and fixed previously, you can fix it by just update the script with
the current version on GitHub by simply copy pasting the related code or redo
the deployment steps. If it is still not working, feel free to report it as a
bug or try to fix it and contribute back to the code base.

### I cannot find some buttons/fields mentioned in this document.

It is likely that the UI/document has changed, try to navigate and find the
updated one. You are also welcome to update this document by contributing to the
project.

### Does this tool collect or send my information?

No. This tool is standalone and doesn't require anything other than the public
APIs from YouTube. User information or usage analytics of any kind are also not
collected in anyway.

### Is there any limit on the usage of the tool?

YouTube Data API are free of charge but with limited quota per day and per user.
As long as you don't open your tool for public, for normal usage the quota
should be more than enough. More information on quota can be found [Google
Developers
website](https://developers.google.com/youtube/v3/getting-started#quota).

Copyright 2017 Google, Inc

