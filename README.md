# Luna — Anti-Nuke & Security Bot

> Powerful Discord security bot developed by **CodeZ devs & Void**

**Website:** https://razebot.site  
**Support:** https://discord.gg/codez  
**License:** MIT

---

## Overview

Luna is a fast, configurable anti-nuke and moderation bot designed to protect Discord servers from nukes, mass actions, and unauthorized changes. It uses an in-memory cache system for near-instant detection and response, backed by MongoDB for persistence and SQLite for local storage.

---

## Features

### Anti-Nuke Protection
- Anti-ban, anti-kick, anti-unban
- Anti-channel create/delete/update
- Anti-role create/delete/update
- Anti-webhook create/update
- Anti-bot add (verified and unverified)
- Anti-server update (name, icon, verification, etc.)
- Anti-emoji/sticker create/delete
- Anti-integration create/delete
- Anti-thread delete
- Anti-mass mention
- Anti-linked role dangerous permissions
- Automatic panic mode when thresholds are exceeded

### Security Management
- Per-guild configurable thresholds (1–20 per module)
- Three punishment types: ban, kick, quarantine
- Quarantine system with role restore
- Whitelist with per-action granularity
- Extra owners (co-owners) system
- Role protection with automatic restoration
- Server configuration backup and restore
- Panic mode with permission snapshot and restore

### Moderation
- Ban, kick, mute (timeout), unban
- Purge, lock, unlock, hide/unhide channels
- Warn system with unique IDs
- Role management (add/remove)
- Snipe deleted messages
- Autorole for members and bots
- Nickname management
- Mass unban / mass unmute

### Automod
- Anti-link filtering
- Anti-Discord-invite filtering
- Anti-spam with configurable message rate
- Badword filter
- Immune roles (bypass automod)
- Configurable action: delete, mute/timeout

### Utility
- Ping with message/WS/API/DB latency
- Bot info, server info, role info, channel info
- User inspect (with security context)
- Avatar command
- Uptime tracker
- Help system with category navigation

### System (Owner-only)
- Eval
- Blacklist (users and servers)
- No-prefix access with optional expiry
- Maintenance mode
- Server list
- Guild info lookup

---

## Setup

### Requirements
- Node.js 18 or higher
- MongoDB database
- Discord bot token with the **Server Members Intent** and **Message Content Intent** enabled

### Installation

```bash
git clone https://github.com/codezdevs/luna
cd luna
npm install
cp .env.example .env
```

Edit `.env` with your bot token, MongoDB URI, and other settings, then:

```bash
npm start
```

---

## Configuration

### Environment Variables

| Variable | Description |
|---|---|
| `TOKEN` | Your Discord bot token |
| `MONGO_DB` | MongoDB connection string |
| `OWNERS` | Comma-separated bot owner IDs |
| `NP_USERS` | Comma-separated no-prefix user IDs |
| `BOT_JOIN_CHANNEL` | Channel ID for guild join logs |
| `BOT_LEAVE_CHANNEL` | Channel ID for guild leave logs |
| `BOT_COMMAND_LOG_CHANNEL` | Channel ID for command logs |
| `COOLDOWN` | Set to `true` to enable command cooldowns |
| `INVITE_LINK` | Your bot's invite link |

---

## Antinuke Quick Start

```
?antinuke enable
?antinuke logs #security-logs
?antinuke punishment ban
?antinuke modules
?antinuke threshold ban 3
?antinuke threshold channel 5
?whitelist add @trusteduser
?extraowner add @coowner
```

---

## Commands Reference

### Security Commands

| Command | Description |
|---|---|
| `antinuke enable/disable` | Toggle antinuke |
| `antinuke config` | Interactive config panel |
| `antinuke modules` | Toggle individual modules |
| `antinuke status` | View full status |
| `antinuke punishment <ban\|kick\|quarantine>` | Set punishment type |
| `antinuke threshold <module> <1-20>` | Set action threshold per module |
| `antinuke notify <on\|off>` | Toggle owner DM alerts |
| `antinuke logs #channel` | Set log channel |
| `antinuke backup` | Snapshot roles and channels |
| `antinuke restore` | Restore from backup |
| `antinuke panic enable/disable` | Manual panic mode control |
| `antinuke resetconfig` | Reset all config to defaults |
| `antinuke repair` | Rebuild security roles |
| `antinuke audit @user` | Security audit on a user |
| `whitelist add/remove/list/reset` | Manage whitelisted users |
| `extraowner add/remove/list/reset` | Manage co-owners |
| `quarantine list/release/view/resetall` | Manage quarantined users |
| `quarantineadd @user [reason]` | Manually quarantine a user |
| `roleprotect add/remove/list` | Protect specific roles |
| `checkantinuke` | Quick status check |
| `security scan` | Security vulnerability scan |

### Moderation Commands

| Command | Description |
|---|---|
| `ban @user [reason]` | Ban a user |
| `kick @user [reason]` | Kick a user |
| `mute @user <duration> [reason]` | Timeout a user |
| `unmute @user` | Remove timeout |
| `unban <id>` | Unban a user |
| `unbanall` | Mass unban all |
| `unmuteall` | Remove all timeouts |
| `purge <1-100> [@user]` | Bulk delete messages |
| `lock [#channel]` | Lock a channel |
| `unlock [#channel]` | Unlock a channel |
| `hide [#channel]` | Hide a channel |
| `unhide [#channel]` | Unhide a channel |
| `warn @user [reason]` | Warn a user |
| `warn list @user` | View warnings |
| `warn remove <id>` | Delete a warning |
| `nick @user [name]` | Change nickname |
| `role add/remove @user @role` | Manage roles |
| `snipe` | View last deleted message |
| `inspect @user` | User info + security context |
| `autorole add/remove/bot/list/reset` | Configure autorole |
| `prefix <new>` | Change server prefix |
| `list admins/adminroles/bots` | List server members by category |

### Utility Commands

| Command | Description |
|---|---|
| `help [command]` | Browse or search commands |
| `ping` | Bot latency stats |
| `uptime` | Bot uptime |
| `botinfo` | Bot statistics |
| `serverinfo` | Server information |
| `roleinfo @role` | Role details |
| `channelinfo [#channel]` | Channel details |
| `avatar @user` | Display avatar |
| `invite` | Get bot invite link |

### Automod Commands

| Command | Description |
|---|---|
| `automod enable/disable` | Toggle automod |
| `automod status` | View configuration |
| `automod antilink on/off` | Filter links |
| `automod antiinvite on/off` | Filter invites |
| `automod antispam on/off [limit]` | Filter spam |
| `automod badwords add/remove/list/reset` | Manage badwords |
| `automod action delete/mute` | Set violation action |

---

## Architecture

```
luna-bot/
  src/
    index.js              - Entry point
    core/
      Client.js           - Extended Discord client
      Config.js           - Environment config
      sentinel.js         - Anti-nuke enforcement engine
      antinukeMemory.js   - In-memory guild state
      buildGuildCache.js  - Cache builder from DB docs
      loadAntiNuke.js     - Startup cache loader
      logSendHandler.js   - Security log formatter
      resolveAuditAdvanced.js - Audit log resolver
      logger.js           - Styled console logger
      util.js             - Utility methods
      loaders/            - Command, event, database loaders
      handlers/           - Error handler
    handlers/
      commandExecution.js - Command runner + cooldown
      noprefixExpiry.js   - No-prefix expiry service
    models/
      antinuke.js         - MongoDB antinuke schema
      automod.js          - MongoDB automod schema
      autorole.js         - MongoDB autorole schema
    events/               - All Discord event handlers
    commands/
      security/           - Antinuke, whitelist, quarantine, etc.
      moderation/         - Ban, kick, purge, lock, etc.
      utility/            - Help, ping, info commands
      automod/            - Automod configuration
      system/             - Owner-only commands
```

---

## License

MIT License — see [LICENSE](./LICENSE) for details.

---

## Credits

**Developed by CodeZ devs & Void**  
Website: https://razebot.site  
Discord: https://discord.gg/codez
