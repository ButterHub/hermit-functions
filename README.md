# hermit-functions
Serverless functions for Hermit, hosted on firebase. 

# Tasks
1. Refactor
2. Validation of request bodies
3. Update models.json
4. Get hermit-prod firebase environment setup
5. Implement delete account, delete decision, delete comment, delete decisionComponent
6. Fix false-alarm race-condition warning: https://eslint.org/docs/rules/require-atomic-updates

# Setup
1. Get environment variables from services (firebase/ gcp, unsplash, etc) and put them in a new file `/functions/.env`, following the `/functions/.env.example` template.
2. Set up 'service account' credentials for firebase on local machine, from [Google's Getting Started With Authentication Guide](https://cloud.google.com/docs/authentication/getting-started). 
3. Public bucket permissions set at [GCP Console](https://console.cloud.google.com/storage). Add `allUsers` member with `Storage Object Viewer` role. **Note: This needs to be done for hermit-prod when it is provisioned. **

# Services
1. [Firebase Console](https://console.firebase.google.com)
   1. Cloud Firestore
   2. Cloud Storage
   3. Cloud Functions
2. [Unsplash API](https://unsplash.com/developers)
3. [GCP Console](https://console.cloud.google.com/) 

# Future challenges
1. Supporting decision comments: Renaming comments collection without losing data or uptime, when supporting decision comments alongside decision component comments
2. Using FCM to alert users about `/notifications` documents