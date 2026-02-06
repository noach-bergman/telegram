
import { TelegramMessage } from "../types";

export class TelegramService {
  private MAX_PAGES_PER_CHANNEL = 4; // צמצום קל לביצועים מהירים יותר ב-Vercel
  
  // רשימת פרוקסים אמינים יותר
  private PROXIES = [
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
  ];

  async fetchFromPublicChannel(channelUsername: string, hoursBack: number = 48): Promise<TelegramMessage[]> {
    const cleanUsername = channelUsername.replace('https://t.me/', '').replace('@', '').replace('/s/', '').split('?')[0].trim();
    if (!cleanUsername) return [];

    const limitDate = Date.now() - (hoursBack * 60 * 60 * 1000);
    let allMessages: TelegramMessage[] = [];
    let lastMessageId: number | null = null;
    let pageCount = 0;

    try {
      // סריקה עמוד אחר עמוד
      while (pageCount < this.MAX_PAGES_PER_CHANNEL) {
        const targetUrl = `https://t.me/s/${cleanUsername}${lastMessageId ? `?before=${lastMessageId}` : ''}`;
        let html = '';
        let fetchSuccess = false;

        // ניסיון לעבור דרך הפרוקסים השונים
        for (const proxyFn of this.PROXIES) {
          try {
            const response = await fetch(proxyFn(targetUrl));
            if (!response.ok) continue;

            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              const data = await response.json();
              html = data.contents || ''; // פורמט של allorigins
            } else {
              html = await response.text();
            }

            if (html && html.includes('tgme_widget_message')) {
              fetchSuccess = true;
              break;
            }
          } catch (e) {
            console.warn(`Proxy attempt failed for ${cleanUsername}`);
          }
        }

        if (!fetchSuccess || !html) break;

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        // טלגרם מציגה הודעות בסדר עולה בדף s/ - אנחנו רוצים לעבד מהחדש לישן
        const messageElements = Array.from(doc.querySelectorAll('.tgme_widget_message_wrap')).reverse();

        if (messageElements.length === 0) break;

        const batchMessages: TelegramMessage[] = [];
        let reachedLimit = false;

        messageElements.forEach((el) => {
          const textEl = el.querySelector('.tgme_widget_message_text') || el.querySelector('.js-message_text');
          const timeEl = el.querySelector('time');
          const messageNode = el.querySelector('.tgme_widget_message');
          
          if (timeEl) {
            const dateStr = timeEl.getAttribute('datetime');
            const date = dateStr ? new Date(dateStr).getTime() : 0;
            
            // אם ההודעה ישנה מדי, מפסיקים לסרוק את הערוץ הזה
            if (date < limitDate) {
              reachedLimit = true;
              return;
            }

            const postLink = messageNode?.getAttribute('data-post') || ''; 
            const msgId = parseInt(postLink.split('/').pop() || '0');

            if (textEl) {
              // בדיקת וידאו (כדי להציג טקסט בלבד כפי שביקשת)
              const isVideo = !!(el.querySelector('.tgme_widget_message_video_wrap') || 
                               el.querySelector('.tgme_widget_message_video_player') || 
                               el.querySelector('.tgme_widget_message_roundvideo_wrap') ||
                               el.querySelector('i.tgme_widget_message_video_icon'));

              let photoUrl = '';
              if (!isVideo) {
                const photoWrap = el.querySelector('.tgme_widget_message_photo_wrap') as HTMLElement;
                if (photoWrap) {
                  const style = photoWrap.getAttribute('style') || '';
                  const match = style.match(/url\(['"]?([^'"]+)['"]?\)/);
                  if (match) photoUrl = match[1];
                }
              }

              batchMessages.push({
                id: msgId || date + Math.random(),
                text: textEl.innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').trim(),
                date: date,
                channelName: el.querySelector('.tgme_widget_message_owner_name')?.textContent?.trim() || cleanUsername,
                channelUsername: cleanUsername,
                photoUrl: photoUrl || undefined
              });
            }
          }
        });

        allMessages = [...allMessages, ...batchMessages];
        
        if (reachedLimit || batchMessages.length === 0) break;

        // מציאת המזהה של ההודעה הכי ישנה בדף הנוכחי כדי להמשיך ממנה אחורה
        const oldestInBatch = batchMessages.sort((a, b) => a.date - b.date)[0];
        lastMessageId = oldestInBatch.id as number;
        pageCount++;

        // המתנה קלה כדי לא להיחסם
        await new Promise(r => setTimeout(r, 150));
      }

      // סינון כפילויות וסידור כרונולוגי
      const uniqueMap = new Map();
      allMessages.forEach(m => uniqueMap.set(m.id, m));
      return Array.from(uniqueMap.values()).sort((a, b) => a.date - b.date);

    } catch (error) {
      console.error(`Fetch error for ${channelUsername}:`, error);
      return [];
    }
  }

  async fetchLatestNews(allowedChannels: string[]): Promise<TelegramMessage[]> {
    if (allowedChannels.length === 0) return [];
    
    // סריקה מקבילית של כל הערוצים
    const promises = allowedChannels.map(channel => this.fetchFromPublicChannel(channel, 48));
    const results = await Promise.all(promises);
    
    return results.flat().sort((a, b) => a.date - b.date);
  }
}

export const telegramService = new TelegramService();
