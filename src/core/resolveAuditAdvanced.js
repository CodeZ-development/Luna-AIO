"use strict";

async function resolveAudit(guild, auditType, targetId, opts = {}) {
    const {
        ttl          = 6_000,
        auditLimit   = 3,
        retryDelayMs = 250,
        allowRetry   = true,
        changeKey    = null,
        changeTargetId = null,
    } = opts;

    const t0 = Date.now();

    const { entry, isEmpty } = await _fetch(guild, auditType, targetId, {
        changeKey, changeTargetId, ttl, limit: auditLimit,
    });

    if (entry) return _result(entry, Date.now() - t0);

    if (allowRetry && isEmpty) {
        await _sleep(retryDelayMs);
        const { entry: r } = await _fetch(guild, auditType, targetId, {
            changeKey, changeTargetId, ttl: ttl + retryDelayMs, limit: auditLimit,
        });
        if (r) return _result(r, Date.now() - t0);
    }

    return null;
}

async function _fetch(guild, auditType, targetId, { changeKey, changeTargetId, ttl, limit } = {}) {
    const logs = await guild.fetchAuditLogs({ limit, type: auditType }).catch(() => null);

    if (!logs || logs.entries.size === 0) return { entry: null, isEmpty: true };

    const cutoff = Date.now() - ttl;

    for (const entry of logs.entries.values()) {
        if (entry.target?.id !== targetId) continue;
        if (entry.createdTimestamp < cutoff) continue;
        if (changeKey !== null && !entry.changes?.some((c) => c.key === changeKey)) continue;
        if (changeTargetId !== null && !_changeContains(entry, changeTargetId)) continue;
        return { entry, isEmpty: false };
    }

    return { entry: null, isEmpty: false };
}

function _changeContains(entry, id) {
    if (!entry.changes) return false;
    for (const c of entry.changes) {
        if (Array.isArray(c.new) && c.new.some((i) => i?.id === id)) return true;
        if (Array.isArray(c.old) && c.old.some((i) => i?.id === id)) return true;
        if (c.new === id || c.old === id) return true;
    }
    return false;
}

function _result(entry, latencyMs) {
    const victimId = entry.target?.id ?? null;
    return {
        executorId: entry.executorId ?? null,
        executor:   entry.executor ?? (entry.executorId ? { id: entry.executorId } : null),
        victimId,
        victim:     entry.target ?? (victimId ? { id: victimId } : null),
        latencyMs,
        raw: entry,
    };
}

const _sleep = (ms) => new Promise((r) => setTimeout(r, ms));

module.exports = resolveAudit;
