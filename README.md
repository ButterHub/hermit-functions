# hermit-functions
Serverless functions for Hermit, hosted on firebase. 

# Tasks
1. Test all endpoints
2. Validation of request bodies
3. Update models.json
4. Get hermit-prod firebase environment setup
5. Implement delete account, delete decision, delete comment, delete decisionComponent

# Setup
1. Get environment variables from services (firebase/ gcp, unsplash, etc) and put them in a new file `/functions/.env`, following the `/functions/.env.example` template.
2. Set up 'service account' credentials for firebase on local machine, from [Google's Getting Started With Authentication Guide](https://cloud.google.com/docs/authentication/getting-started). 

# Services
1. [Firebase Console](https://console.firebase.google.com)
   1. Cloud Firestore
   2. Cloud Storage
   3. Cloud Functions
2. [Unsplash API](https://unsplash.com/developers)

# Future challenges
1. Renaming comments collection without losing data or uptime, when supporting decision comments alongside decision component comments.
2. Update FCM