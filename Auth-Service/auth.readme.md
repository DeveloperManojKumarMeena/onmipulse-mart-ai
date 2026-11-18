# 🔐 Auth Service (Authentication & User Management Microservice)

यह माइक्रोसर्विस हमारे ई-कॉमर्स मार्केटप्लेस के लिए सभी **Authentication, Authorization, User Profile, Address Management** और **Identity Verification** (Email/Mobile OTP & Google OAuth) को संभालती है[cite: 2]।

---

## 🛠️ Tech Stack & Architecture Standards

- **Runtime & Framework:** Node.js, Express.js
- **Database:** MongoDB (Mongoose ODM) & Redis (OTP स्टोरेज और Refresh Token Blacklisting के लिए)
- **Message Broker:** RabbitMQ (Event-Driven Architecture के लिए)[cite: 1]
- **Validation:** `Zod` या `express-validator`[cite: 2]
- **Security:** `bcrypt` (Password Hashing), `JWT` (Access & Refresh Tokens), `httpOnly` Cookies, Server-side HTML Sanitization (`sanitize-html` / `DOMPurify`)[cite: 2]
- **OAuth & Verification:** Google OAuth 2.0 (`google-auth-library` / `Passport.js`), Nodemailer/Resend (Email OTP), Twilio/Fast2SMS (Mobile OTP)

### 🌐 Global API Conventions
1. **Implicit Versioning:** सभी रूट्स बेस पाथ के ज़रिए वर्जन किए गए हैं (जैसे `/api/v1/auth/...`)[cite: 2]।
2. **Request Correlation:** डिबगिंग और माइक्रोसर्विसेज ट्रेसिंग के लिए हर रिक्वेस्ट हेडर में `x-request-id` भेजना अनिवार्य है[cite: 2]।
3. **Validation & Idempotency:** सभी इनपुट्स को कंट्रोलर से पहले वैलिडेट किया जाता है और क्रिटिकल एंडपॉइंट्स (जैसे लॉगआउट, वेरिफिकेशन) Idempotent हैं[cite: 2]।

---

## 🚀 Core Features

1. **Role-Based Registration:** यूजर `USER` या `SELLER` के रूप में अकाउंट बना सकता है[cite: 2]।
2. **Multi-Channel Verification:** रजिस्ट्रेशन के दौरान और बाद में **Email OTP** और **Mobile Number OTP** वेरिफिकेशन।
3. **Social Authentication:** वन-क्लिक **Google Sign-Up / Sign-In** सपोर्ट (जिसमें ऑटोमैटिक ईमेल वेरिफिकेशन शामिल है)।
4. **Dual Token Security:**
   - **Access Token:** शॉर्ट-लिव्ड (जैसे 15 मिनट), जिसे JSON रिस्पॉन्स बॉडी में भेजा जाता है[cite: 2]।
   - **Refresh Token:** लॉन्ग-लिव्ड (जैसे 7 दिन), जिसे सुरक्षित `httpOnly`, `Secure`, `SameSite` कुकी में स्टोर किया जाता है[cite: 2]।
5. **Device Metadata Logging:** लॉगिन के समय यूजर का IP, Browser, और Device टाइप लॉग किया जाता है[cite: 2]।
6. **Saved Addresses:** यूजर अपने डिलीवरी एड्रेस जोड़ सकता है, डिफ़ॉल्ट सेट कर सकता है और डिलीट कर सकता है[cite: 2]।

---

## 📡 API Endpoints

### 1. Authentication & Verification

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/auth/register` | `USER` या `SELLER` अकाउंट बनाता है[cite: 2]। ईमेल/मोबाइल यूनिकनेस चेक करता है, पासवर्ड हैश करता है और वेरिफिकेशन OTP ट्रिगर करता है[cite: 2]। `user.created` इवेंट एमिट करता है[cite: 2]। | ❌ |
| `POST` | `/auth/verify-email` | रजिस्टर्ड ईमेल पर भेजे गए OTP को वेरिफाई करता है। | ❌ |
| `POST` | `/auth/verify-mobile` | रजिस्टर्ड मोबाइल नंबर पर भेजे गए SMS OTP को वेरिफाई करता है। | ❌ |
| `POST` | `/auth/resend-otp` | ईमेल या मोबाइल के लिए नया OTP दोबारा भेजता है (Rate-limited)। | ❌ |
| `POST` | `/auth/google` | Google ID Token को वेरिफाई करके यूजर को Sign-In या नया अकाउंट Sign-Up करता है। `httpOnly` कुकी + Access Token जारी करता है। | ❌ |
| `POST` | `/auth/login` | Email + Password लॉगिन[cite: 2]। सफल होने पर `httpOnly` रिफ्रेश कुकी + शॉर्ट-लिव्ड एक्सेस टोकन देता है और डिवाइस मेटाडेटा लॉग करता है[cite: 2]। | ❌ |
| `POST` | `/auth/refresh-token` | `httpOnly` कुकी से नया Access Token जनरेट करता है। | 🍪 (Cookie) |
| `POST` | `/auth/logout` | वर्तमान रिफ्रेश सेशन को रद्द (Revoke) करता है और कुकीज़ क्लियर करता है[cite: 2]। यह **Idempotent** है[cite: 2]। | ✅ |

---

### 2. User Profile Management

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/auth/me` | वर्तमान लॉग-इन यूजर की जानकारी (`id`, `roles`, `profile`, `verificationStatus`) लौटाता है[cite: 2]। | ✅ |
| `PATCH` | `/auth/users/me` | प्रोफ़ाइल फ़ील्ड्स अपडेट करता है; XSS से बचने के लिए सर्वर-साइड HTML सैनिटाइज़ करता है[cite: 2]। एनालिटिक्स के लिए `user.updated` इवेंट एमिट करता है[cite: 2]। | ✅ |

---

### 3. Address Management

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/auth/users/me/addresses` | यूजर के सभी सेव किए गए एड्रेस की लिस्ट देता है और डिफ़ॉल्ट एड्रेस को मार्क करता है[cite: 2]। | ✅ |
| `POST` | `/auth/users/me/addresses` | नया एड्रेस जोड़ता है (Pincode और Phone नंबर के सख्त वैलिडेशन के साथ)[cite: 2]। | ✅ |
| `DELETE` | `/auth/users/me/addresses/:addressId` | दिए गए `addressId` वाले एड्रेस को हटाता है[cite: 2]। | ✅ |

---

## 🐇 RabbitMQ Events (Asynchronous Communication)

यह सर्विस अन्य माइक्रोसर्विसेज (जैसे **Notification Service**, **Cart Service**, **Seller Service**) को सूचित करने के लिए निम्नलिखित इवेंट्स पब्लिश करती है[cite: 1]:

1. **`user.created`**
   - **कब ट्रिगर होता है:** नया यूजर रजिस्टर होने पर (सामान्य रजिस्ट्रेशन या Google Sign-Up के ज़रिए)[cite: 2]।
   - **Payload:** `{ userId, email, mobile, role, name, isEmailVerified, isMobileVerified }`
   - **Consumers:** `Notification Service` (वेलकम ईमेल/OTP भेजने के लिए), `Seller Service` (यदि रोल `SELLER` है तो सेलर प्रोफ़ाइल बनाने के लिए)[cite: 1]।

2. **`user.otp.requested`**
   - **कब ट्रिगर होता है:** ईमेल या मोबाइल वेरिफिकेशन OTP जनरेट होने पर।
   - **Payload:** `{ userId, type: 'EMAIL' | 'MOBILE', target, otp, expiresIn }`
   - **Consumers:** `Notification Service` (ईमेल या SMS के माध्यम से OTP डिलीवर करने के लिए)[cite: 1]।

3. **`user.updated`**
   - **कब ट्रिगर होता है:** यूजर अपनी प्रोफ़ाइल अपडेट करता है या ईमेल/मोबाइल वेरिफाई करता है[cite: 2]।
   - **Payload:** `{ userId, updatedFields, timestamp }`
   - **Consumers:** Analytics / Search / Other dependent services[cite: 2]।

---

## 📂 Suggested Folder Structure

```text
auth-service/
├── src/
│   ├── config/          # DB, Redis, RabbitMQ, और Google OAuth कॉन्फ़िगरेशन
│   ├── controllers/     # रिक्वेस्ट हैंडलिंग लॉजिक (auth, user, address)
│   ├── middlewares/     # JWT Auth, Role Check, x-request-id, Error Handler, Rate Limiter
│   ├── models/          # Mongoose Schemas (User, Address, Session/DeviceLog)
│   ├── routes/          # Express Routes
│   ├── services/        # बिज़नेस लॉजिक (Token, OTP, Google Auth, Sanitization)
│   ├── events/          # RabbitMQ Publisher & Event Schemas
│   ├── validators/      # Zod / Express-Validator Schemas
│   └── app.js           # Express ऐप सेटअप
├── .env.example         # एनवायरनमेंट वेरिएबल्स टेम्पलेट
├── package.json
└── README.md