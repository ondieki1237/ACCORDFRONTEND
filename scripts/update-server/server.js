const express = require('express')
const path = require('path')
const app = express()
const PORT = process.env.PORT || 4000

// Serve static APK files from ./apk (place your app-release.apk here)
app.use('/apk', express.static(path.join(__dirname, 'apk')))

// Simple update endpoint
// Example response:
// {
//   "versionCode": 42,
//   "versionName": "1.3.0",
//   "apkUrl": "https://yourdomain.com/apk/app-release.apk",
//   "forceUpdate": false,
//   "changelog": "- Fixes and improvements"
// }
app.get('/app/update', (req, res) => {
  const HOST = process.env.HOSTNAME || req.headers.host
  const protocol = req.headers['x-forwarded-proto'] || 'https'
  const apkPath = process.env.APK_PATH || `${protocol}://${HOST}/apk/app-release.apk`

  const response = {
    versionCode: parseInt(process.env.VERSION_CODE || '2', 10),
    versionName: process.env.VERSION_NAME || '0.0.2',
    apkUrl: apkPath,
    forceUpdate: process.env.FORCE_UPDATE === 'true' || false,
    changelog: process.env.CHANGELOG || "Minor fixes and improvements"
  }

  res.json(response)
})

app.listen(PORT, () => {
  console.log(`Update server listening on http://localhost:${PORT}`)
})
