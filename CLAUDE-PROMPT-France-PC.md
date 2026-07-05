==================================================================
  👇 EI PURO TEXT-TA COPY KORE FRANCE-PC-r CLAUDE CODE-e PASTE KORO
==================================================================
(Tailscale account-ta niche bosiye dao age — line-e <<...>> jaygায়)

------------------------------------------------------------------

You are helping set up several Android phones on THIS Windows PC so that
they can be remote-controlled from another PC over the internet, using
Tailscale (a mesh VPN) + adb wireless + scrcpy. The phones are physically
here and connected (or can be connected) to this PC by USB cable. A human
is next to the phones and can tap on their screens when you ask.

GOAL: make every phone reachable over Tailscale so it auto-appears on the
remote controller. For each phone you must end with: (a) Tailscale ON and
logged into the SAME account, (b) phone on Wi-Fi, (c) adb "tcpip 5555"
enabled, (d) model + Tailscale IP reported back.

THE TAILSCALE ACCOUNT TO USE (same on every phone AND this PC):
    <<FILL IN: your Tailscale account, e.g. you@gmail.com>>

TWO HARD RULES (tell the human, enforce them):
  1. Every phone + this PC must be on the SAME Tailscale account above.
  2. Keep each phone on Wi-Fi, NOT mobile data. Wi-Fi = direct = fast.
     Mobile data = relay = slow. (Verify later with `tailscale ping`.)

--- WHAT TO DO (do the PC steps yourself; instruct the human for phone taps) ---

STEP A — Install tools on THIS PC (idempotent, skip if already present):
  - Tailscale:  winget install --id Tailscale.Tailscale --source winget --accept-package-agreements --accept-source-agreements --silent
  - scrcpy+adb: winget install --id Genymobile.scrcpy --source winget --accept-package-agreements --accept-source-agreements --silent
  - adb.exe / scrcpy.exe live inside the winget scrcpy package folder under
    %LOCALAPPDATA%\Microsoft\WinGet\Packages\ (search for scrcpy.exe).
  - Tailscale CLI: "C:\Program Files\Tailscale\tailscale.exe"

STEP B — Log THIS PC into Tailscale on the account above:
  - Run: & "C:\Program Files\Tailscale\tailscale.exe" up
  - If it opens a browser / prints a login URL, tell the human to sign in
    with the account above. Confirm with `tailscale status` (BackendState=Running).

STEP C — For EACH phone, do this loop:
  1. Ask the human to connect ONE phone by USB and, on the phone, enable:
     Settings > About phone > tap "Build number" 7x  (Developer options)
     Settings > Developer options > USB debugging = ON
     Settings > Developer options > Stay awake = ON
  2. Run `adb devices`. If the phone shows "unauthorized", tell the human to
     tap "Allow USB debugging" on the phone (tick "Always allow") and OK.
  3. Read info:
     adb -s <serial> shell getprop ro.product.model
     adb -s <serial> shell getprop ro.build.version.release
  4. Tell the human on THIS phone: install Tailscale from Play Store, open it,
     Sign in with the SAME account above, Allow the VPN request. Wait until it
     shows "Connected". (You cannot automate Google login — the human does it.)
  5. Make sure the phone is on Wi-Fi (not mobile data). You can enable Wi-Fi
     with: adb -s <serial> shell svc wifi enable   (the human picks/joins the
     Wi-Fi network on the phone if none is saved).
  6. Enable wireless adb:  adb -s <serial> tcpip 5555
     (You'll see "restarting in TCP mode port: 5555". The USB session drops —
     that's normal.)
  7. Find this phone's Tailscale IP: run
     & "C:\Program Files\Tailscale\tailscale.exe" status
     and match the phone by its hostname (usually the model/brand). The IP is
     the 100.x.x.x address.
  8. Verify wireless control works locally:
     adb connect <tailscale-ip>:5555
     Then briefly launch scrcpy to confirm the screen mirrors:
     <scrcpy.exe> -s <tailscale-ip>:5555 --max-size=800
     Close scrcpy after confirming.
  9. The human can now unplug the USB cable. Record: MODEL + TAILSCALE IP.

STEP D — REMOTE-PC AUTHORIZATION (important, do NOT skip):
  The first time the REMOTE controller PC connects to a phone over Tailscale,
  that phone will show an "Allow USB debugging?" popup for the REMOTE PC's key.
  Coordinate: while the human is still holding the phones, have the remote user
  connect once from their dashboard; the human taps "Always allow" + OK on each
  phone. After that the remote PC is permanently authorized.

STEP E — Report back a clean table:
     | Phone model | Android | Tailscale IP  | Wi-Fi? | tcpip 5555? |
  and list any phone that failed and why.

--- REBOOT WARNING (tell the human) ---
  `adb tcpip 5555` is LOST when a phone reboots. To survive reboots without
  re-plugging USB, either: keep phones powered on & never reboot (set "Stay
  awake"), or root the phone and use a "WiFi ADB" app that re-enables adb-over-
  wifi on boot. Otherwise, after any reboot, redo Step C.6 for that phone.

Work through the phones one by one. Be concise. Confirm each phone is
reachable over its Tailscale IP before moving to the next. At the end give me
the final table of MODEL + TAILSCALE IP so I can confirm them on the remote
dashboard.
------------------------------------------------------------------
