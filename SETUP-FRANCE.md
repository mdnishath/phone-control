# 🇫🇷 France Phone Setup — Full Guide

BD theke France phone control korar jonno protita phone EK-BAR setup korte hobe.
Setup-er somoy phone-er kachে ekjon manush + ekta laptop (USB cable soho) lage.

---

## ⚠️ Age bujhe nao — 2 ta joruri niyom

1. **Same Tailscale account:** phone ar tomar BD PC — dutো **eki account e** thakte hobe
   (dashboard-er upore je account chip dekhacche — thik oi account e phone login korba).
2. **Wi-Fi, mobile data NA:** phone Wi-Fi te thakle DIRECT connection = fast (~150ms).
   Mobile data = relay = slow (~300ms). Dashboard e "direct"(sobuj)/"relay"(kmla) badge dekhbe.

---

## STEP 1 — Phone Settings (protita phone)

1. **Developer Options on:** Settings → About phone → "Build number" e **7 bar tap**।
2. **USB Debugging on:** Settings → Developer options → **USB debugging** = ON।
3. **Stay awake on (recommended):** Developer options → **Stay awake** = ON
   (charge e thakle screen off hobe na)।

## STEP 2 — Tailscale (protita phone)

1. Play Store → **Tailscale** install।
2. Open → **Sign in** → **BD PC-r same account** e login (Google/email)।
3. VPN permission chaile **Allow**।
4. Tailscale **"Connected"** dekhabe — done।

## STEP 3 — Wireless ADB on (USB, ek-bar)

Ei step e phone-take laptop-e USB cable diye lagate hobe (jekono Windows laptop,
jekhane scrcpy/adb ache — na thakle Dashboard → Setup → Install scrcpy)।

1. Phone-take laptop-e **USB cable** diye lagao।
2. Phone e popup ashbe: **"Allow USB debugging?"** → **"Always allow"** tick → **OK**।
3. Laptop e PhoneControl folder-er **`Enable-Wireless-USB.bat`** double-click।
   → "restarting in TCP mode port: 5555" dekhle hoye geche।
4. **Cable khule felo**। Phone ekhon Wi-Fi/Tailscale diye adb neবে।

## STEP 4 — Phone-take Wi-Fi te dao

Mobile data OFF, **Wi-Fi ON** (France-er ghor/office-er Wi-Fi)।
Tailscale connected thakbe.

## STEP 5 — BD PC theke prothom connect (GOTCHA — এটা miss korো na!)

Prothom bar jokhon tomar **BD PC** ei phone-e connect korbe, phone-er screen e
**abar** "Allow USB debugging from this computer?" popup ashbe (ei bar BD PC-r key-r jonno)।

➡️ **France-er manush-take bolo phone e "Always allow" tick kore OK korte** —
   ei somoy tumi BD theke dashboard e phone-er **Control** e click korba (ba Refresh)।
   Ekbar Allow korle BD PC permanently authorized — ar kokhono popup ashbe na।

**Tip:** STEP 3 ar STEP 5 ekসাথে koro — France-er manush jokhon phone hate niye ache,
tokhoni tumi BD theke connect kore Allow koriye nao।

## STEP 6 — Done ✅

Phone online + Wi-Fi te thakle tomar **dashboard e nije card হয়ে ashbe**
(model, battery, IP soho)। **Control** e click → scrcpy khulbe → phone control।

---

## 🔁 Reboot hole ki hobe? (joruri)

`tcpip 5555` reboot-e chole jay (phone restart korle)। Tokhon abar STEP 3 lagbe।
France-e bar bar USB kora jhamela — tai ekta option beche nao:

- **Sobcheye shohoj:** phone-gula **kokhono reboot/off korবে na**, charge e "stay awake" rekhe dao।
- **Permanent (best):** phone **root kore** "WiFi ADB" type app diye boot-e auto adb-over-wifi on
  (persist.adb.tcp.port=5555)। Tahole reboot-eও nije on thakবে।
- France-e laptop thakle: reboot hole abar `Enable-Wireless-USB.bat`।

---

## Account change korle
Dashboard je account e ache — phone-o oi account e hote hobe।
Account switch korle (Setup panel → switch), phone-gulakেও oi notun account e login korte hobe,
noile dashboard e ashbe na।

---

## Somossa? checklist
- [ ] Phone Wi-Fi te? (mobile data na)
- [ ] Tailscale connected + same account?
- [ ] USB debugging on + tcpip 5555 kora?
- [ ] BD PC-r "Allow" popup phone e OK kora?
- [ ] Reboot hoyeche? → tcpip 5555 abar korte hobe
