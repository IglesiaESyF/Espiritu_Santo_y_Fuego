import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

admin.initializeApp()

const LIVE_PATH = 'config/live'
const SITE_URL = 'https://IglesiaESyF.github.io/Espiritu_Santo_y_Fuego/en-vivo/'

export const notifyWhatsAppOnLive = functions.firestore
  .document(LIVE_PATH)
  .onWrite(async (change) => {
    const before = change.before?.data()
    const after = change.after?.data()

    if (!after) return

    const wasOff = before ? !before.activo : true
    const nowOn = after.activo === true

    if (!wasOff || !nowOn) return

    const token = functions.config().whatsapp?.token
    const phoneNumberId = functions.config().whatsapp?.phoneid
    const channelId = functions.config().whatsapp?.channelid

    if (!token || !phoneNumberId || !channelId) {
      functions.logger.warn('WhatsApp config missing — set with: firebase functions:config:set whatsapp.token="..." whatsapp.phoneid="..." whatsapp.channelid="..."')
      return
    }

    const mensaje = after.mensaje || '¡Estamos transmitiendo en vivo!'
    const text = `🔴 ¡EN VIVO!\n\n${mensaje}\n\nÚnete ahora: ${SITE_URL}`

    try {
      const res = await fetch(
        `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: channelId,
            type: 'text',
            text: { preview_url: true, body: text },
          }),
        }
      )

      if (!res.ok) {
        const err = await res.text()
        functions.logger.error('WhatsApp API error:', err)
      } else {
        functions.logger.info('WhatsApp notification sent successfully')
      }
    } catch (err) {
      functions.logger.error('Failed to send WhatsApp notification:', err)
    }
  })
