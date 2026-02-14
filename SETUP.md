# Setting Up Google Sign-In

To make the "Sign in with Google" button work, you need to configure a Google Cloud Project and get a Client ID.

## Steps

1.  **Go to Google Cloud Console**:
    -   Visit [https://console.cloud.google.com/](https://console.cloud.google.com/).
2.  **Create a Project**:
    -   Click "Select a project" -> "New Project".
    -   Name it "Vortex Innovators" (or similar).
3.  **Configure OAuth Consent Screen**:
    -   Go to **APIs & Services** -> **OAuth consent screen**.
    -   Select **External** -> Create.
    -   Fill in App Name, User Support Email, and Developer Contact Info.
    -   Save and Continue.
4.  **Create Credentials**:
    -   Go to **APIs & Services** -> **Credentials**.
    -   Click **Create Credentials** -> **OAuth client ID**.
    -   Application Type: **Web application**.
    -   Name: "Web Client 1".
    -   **Authorized JavaScript origins**:
        -   Add the URL where your site is hosted (e.g., `http://localhost:5500` if using Live Server, or your production URL).
        -   **Important**: If testing locally, you MUST add `http://localhost` and `http://localhost:PORT`.
    -   Click **Create**.
5.  **Copy Client ID**:
    -   You will see a Client ID (e.g., `123456789-abcdefg.apps.googleusercontent.com`).
    -   Copy this string.

## Update Code

Open `login.html` and find this line:

```html
<div id="g_id_onload"
     data-client_id="YOUR_GOOGLE_CLIENT_ID"
     ...
```

Replace `YOUR_GOOGLE_CLIENT_ID` with the actual ID you copied.

```html
<div id="g_id_onload"
     data-client_id="123456789-abcdefg.apps.googleusercontent.com"
     ...
```

**Note**: Changes might take a few minutes to propagate from Google's side.
