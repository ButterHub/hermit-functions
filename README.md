# hermit-functions
Serverless functions for Hermit, hosted on firebase. 

# Urgent tasks
1. Test all endpoints
2. Update models.json
3. Get hermit-prod firebase environment setup
4. Go through all #TODO

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