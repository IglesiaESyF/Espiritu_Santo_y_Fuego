const { TwaGenerator, TwaManifest, Config, ConsoleLog, BufferedLog, JdkHelper } = require('@bubblewrap/core')
const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')

const DIR = __dirname
const MANIFEST_URL = 'https://IglesiaESyF.github.io/Espiritu_Santo_y_Fuego/manifest.json'
const KEYSTORE = path.join(DIR, 'iesfuego.keystore')
const KEY_ALIAS = 'iesfuego'
const KEY_PASS = 'iesfuego123'
const STORE_PASS = 'iesfuego123'
const PKG = 'com.iglesiaesyf.app'

async function main() {
  const jdkPath = (process.env.JAVA_HOME || 'C:\\Program Files\\Android\\Android Studio\\jbr').trim()
  const androidSdkPath = process.env.ANDROID_HOME || 'C:\\Users\\print\\AppData\\Local\\Android\\Sdk'

  console.log('1. Downloading web manifest...')
  const resp = await fetch(MANIFEST_URL)
  const webManifest = await resp.json()
  const webManifestUrl = new URL(MANIFEST_URL)

  console.log('2. Creating TWA manifest...')
  const twaManifest = TwaManifest.fromWebManifestJson(webManifestUrl, webManifest)
  twaManifest.packageId = PKG
  twaManifest.appVersionCode = 1
  twaManifest.appVersionName = '1.0'
  twaManifest.enableNotifications = false
  twaManifest.signingKey = {
    path: KEYSTORE,
    alias: KEY_ALIAS,
  }

  if (!fs.existsSync(KEYSTORE)) {
    console.log('3. Generating keystore...')
    execSync(
      `"${jdkPath}\\bin\\keytool.exe" -genkey -v -keystore "${KEYSTORE}" -alias ${KEY_ALIAS} -keyalg RSA -keysize 2048 -validity 10000 -storepass ${STORE_PASS} -keypass ${KEY_PASS} -dname "CN=IESFuego, OU=IT, O=IglesiaESyF, L=Managua, ST=MN, C=NI"`,
      { stdio: 'inherit', shell: 'cmd.exe' }
    )
  }

  console.log('4. Generating Android project...')
  const generator = new TwaGenerator()
  const log = new BufferedLog(new ConsoleLog('TWA'))
  await generator.createTwaProject(DIR, twaManifest, log)

  const config = new Config(jdkPath, androidSdkPath)
  await config.saveConfig(path.join(DIR, 'bubblewrap.config.json'))
  await twaManifest.saveToFile(path.join(DIR, 'twa-manifest.json'))

  console.log('5. Building APK with Gradle...')
  process.env.BUBBLEWRAP_KEYSTORE_PASSWORD = STORE_PASS
  process.env.BUBBLEWRAP_KEY_PASSWORD = KEY_PASS
  const gradlew = path.join(DIR, 'gradlew.bat')
  execSync(`"${gradlew}" assembleRelease --stacktrace`, {
    cwd: DIR,
    stdio: 'inherit',
    shell: 'cmd.exe',
    env: {
      ...process.env,
      JAVA_HOME: jdkPath,
      ANDROID_HOME: androidSdkPath,
    }
  })

  console.log('6. Signing APK...')
  const apkUnsigned = path.join(DIR, 'app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk')
  const apkSigned = path.join(DIR, 'app-release-signed.apk')
  execSync(
    `"${androidSdkPath}\\platform-tools\\adb" --version >nul 2>&1`,
    { stdio: 'ignore', shell: 'cmd.exe' }
  )
  execSync(
    `"${androidSdkPath}\\build-tools\\35.0.0\\apksigner.bat" sign --ks "${KEYSTORE}" --ks-key-alias ${KEY_ALIAS} --ks-pass pass:${STORE_PASS} --key-pass pass:${KEY_PASS} --out "${apkSigned}" "${apkUnsigned}"`,
    { stdio: 'inherit', shell: 'cmd.exe' }
  )

  const stats = fs.statSync(apkSigned)
  console.log(`\n✓ APK generated: ${apkSigned}`)
  console.log(`  Size: ${(stats.size / 1024 / 1024).toFixed(1)} MB`)
  console.log(`  Package: ${PKG}`)
  console.log(`  Version: 1.0 (code 1)`)
}

main().catch((err) => { console.error(err); process.exit(1) })
