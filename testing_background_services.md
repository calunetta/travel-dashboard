# Testing Background Services & Notifications

This guide outlines exactly how to verify our recently implemented background services (FCM Push Notifications and Nodemailer Emails via Cloud Functions).

## 1. PWA Push Notifications (FCM)

The Travel Handling App relies on Firebase Cloud Messaging (FCM) to send push notifications to admins when trip documents are uploaded, when payments are completed, and when upcoming trips are missing documents.

### Finding Your FCM Token
Before testing, you need the FCM token registered for your browser/device:
1. Open the Travel Admin app in your browser (`http://localhost:4200`).
2. Open Chrome DevTools (F12) -> Application -> IndexedDB -> `firebase-messaging-database`.
3. Alternatively, check your Firestore document in the `admins` collection. Ensure the `fcmToken` field is populated with a long string.

### Method A: Testing via Firebase Console (Easiest)
1. Go to the [Firebase Console](https://console.firebase.google.com/) and open your project.
2. Navigate to **Engage > Messaging** in the left sidebar.
3. Click **New campaign** and select **Notifications**.
4. Enter a test Title and Text.
5. Click **Send test message**.
6. Paste your `fcmToken` in the box, click the `+` to add it, and click **Test**.
7. *Note:* Make sure the Travel Admin app is in the background (switch to another tab) to see the OS-level push notification, or watch the console if you have foreground handling enabled.

### Method B: Testing via cURL (FCM HTTP v1 API)
Since we are using the modern FCM v1 API, you must use an OAuth2 access token to authenticate the request.
First, get a temporary access token using the Google Cloud CLI (if installed and authenticated):
```bash
gcloud auth print-access-token
```
Then, execute the following cURL command (replace `YOUR_ACCESS_TOKEN`, `YOUR_PROJECT_ID`, and `YOUR_FCM_TOKEN`):

```bash
curl -X POST -H "Authorization: Bearer YOUR_ACCESS_TOKEN" -H "Content-Type: application/json" -d '{
  "message": {
    "token": "YOUR_FCM_TOKEN",
    "notification": {
      "title": "Test from CLI",
      "body": "This is a direct FCM push notification test."
    }
  }
}' "https://fcm.googleapis.com/v1/projects/YOUR_PROJECT_ID/messages:send"
```

---

## 2. Email Triggers (`onTripCreated`)

The `onTripCreated` Cloud Function is triggered whenever a new trip is added to the `trips` collection. It generates an `.ics` calendar file and emails all `SUPER_ADMIN` users.

### Testing Locally with Firebase Emulator Suite
The safest way to test emails and triggers without affecting production data is using the Emulator Suite.

1. **Setup Nodemailer Credentials**
   The function uses environment variables (`SMTP_HOST`, `SMTP_USER`, etc.). We recommend using [Ethereal Email](https://ethereal.email/) for local testing. It provides fake SMTP credentials that catch emails and let you view them on their website.
   - Go to Ethereal Email and click "Create Ethereal Account".
   - In `functions/.env.local`, set the variables:
     ```env
     SMTP_HOST="smtp.ethereal.email"
     SMTP_PORT="587"
     SMTP_USER="your-ethereal-user@ethereal.email"
     SMTP_PASS="your-ethereal-password"
     ```

2. **Start the Emulators**
   From your project root, build the functions and start the emulators:
   ```bash
   cd functions
   npm run build
   cd ..
   firebase emulators:start
   ```

3. **Trigger the Function**
   Once the emulator is running, you can trigger the function by creating a mock trip document in the local Firestore emulator.
   - Open the Emulator UI (usually `http://localhost:4000`).
   - Navigate to the **Firestore** tab.
   - Create a new document in the `trips` collection with a `destination` and a `startDate` (e.g., `2026-10-15`).
   
   Alternatively, you can trigger it directly from the Functions emulator shell:
   ```bash
   firebase functions:shell
   # Inside the shell:
   onTripCreated({ destination: "Test Trip", startDate: "2026-12-01", code: "TST001" })
   ```

4. **Verify the Output**
   - Check the terminal where `firebase emulators:start` is running. You should see logs indicating the `onTripCreated` function executed successfully.
   - Go to your Ethereal Email account (or whatever SMTP catcher you configured). You will see the incoming email containing the subject "New Trip Created: Test Trip" and the attached `reminder.ics` file.

### Important Notes for Production
- In production, you must use a real SMTP service (e.g., SendGrid, Mailgun, or Google Workspace SMTP) and configure the environment variables either via Firebase Secrets (`firebase functions:secrets:set SMTP_PASS`) or a `.env` file deployed with the functions.
- Ensure your production `admins` collection actually has users with `role: "SUPER_ADMIN"`, otherwise the function will exit early without sending the email.
