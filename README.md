# Manage your zoneminder events
**Why:** I have made this application because I didn't want to expose my zoneminder instance to the internet, while wanting to watch events and be able to remove them.

![](doc/arch.png)

# Features
- Authentication
- View all events
- Bulk delete events
- Review snapshot image
- Review events video

![](doc/events.png)


![](doc/snapshot.png)

# Usage
|Env||
|-|-|
|ZM_HOST|root url to contact zoneminder, e.g: https://YOUR_HOST:PORT/zm/|
|ZM_TLS_INSECURE|disable TLS peer verifier, needed if you use self signed certificate on ZM. **default** false|
|SESSION_COOKIE_INSECURE|don't set secure flag on cookie, needed if you deploy this app without https. **default** false|
|SESSION_DURATION_IN_MS|Session cookie maxAge in milliseconds **default 1 year**|
|SESSION_COOKIE_SALT|Salt to encrypt cookie sould be at least 32 bytes, **has a default value but please provide your own**|
|SESSION_COOKIE_SECRET|Secret to encrypt cookie sould be at least 32 bytes, **has a default value but please provide your own**|

`docker run -p 3000:3000 -e ZM_HOST=https://YOUR_ZM/zm/ -e ZM_TLS_INSECURE=true -e SESSION_COOKIE_SALT=A_RANDOM_32_BYTES_STRING -e SESSION_COOKIE_SECRET=A_RANDOM_32_BYTES_STRING nmeylan/zoneminder-events-management:latest`

Access to https://YOUR_HOST:3000, Authenticate using your zoneminder user.

# Security

All pages are protected by authentication. 
 
When user submit login form, we send credentials to zoneminder, if credentials are correct, we create a session cookie. Session cookie is encrypted using libsodium.

# Performance
- Snapshots images are **not** downloaded by this application, we only retrieve binary data that we send to frontend. Image are buffered in memory during the process.
- Videos are **not** downloaded by this application, video is retrieved from zoneminder using a streamed http call, the stream is forwarded to frontend. Video are **not** buffered in memory.  

# To improve
As I expect to not have many events, I have not implemented pagination which can be an issue when someone has many events.
