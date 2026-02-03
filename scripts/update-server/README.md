Update server (example)

How to run:

- Place your APK file at `scripts/update-server/apk/app-release.apk` (create `apk` folder).
- Configure environment variables if needed:
  - `VERSION_CODE` (number)
  - `VERSION_NAME` (string)
  - `FORCE_UPDATE` (true|false)
  - `CHANGELOG` (string)

Install and run:

```bash
cd scripts/update-server
npm install
npm start
```

The update endpoint will be available at `http://localhost:4000/app/update` and the APK at `http://localhost:4000/apk/app-release.apk`.

Docker (run example server in a container):

```bash
cd scripts/update-server
docker build -t accord-update-server .
docker run -e VERSION_CODE=5 -e VERSION_NAME=1.0.5 -e APK_PATH=https://app.codewithseth.co.ke/apk/app-release.apk -p 4000:4000 accord-update-server
```

The container exposes `/app/update` on port 4000.
