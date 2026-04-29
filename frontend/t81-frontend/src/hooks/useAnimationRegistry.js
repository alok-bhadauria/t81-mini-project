import { useState, useEffect } from "react";

let _registryCache = null;
let _registryPromise = null;

async function fetchRegistry() {
    if (_registryCache) return _registryCache;
    if (_registryPromise) return _registryPromise;

    _registryPromise = fetch("/animations/registry.json")
        .then((r) => {
            if (!r.ok) throw new Error("Registry not found");
            return r.json();
        })
        .then((data) => {
            _registryCache = data;
            return data;
        })
        .catch(() => {
            _registryCache = {};
            return {};
        });

    return _registryPromise;
}

export function resolveTokenToFile(registry, token) {
    const tokenLower = token.toLowerCase();
    for (const [, entry] of Object.entries(registry)) {
        if (entry.tags && entry.tags.includes(tokenLower)) {
            return entry.file;
        }
    }
    return null;
}

export function useAnimationRegistry() {
    const [registry, setRegistry] = useState(_registryCache || {});
    const [loading, setLoading] = useState(!_registryCache);

    useEffect(() => {
        if (_registryCache) {
            setRegistry(_registryCache);
            setLoading(false);
            return;
        }
        fetchRegistry().then((r) => {
            setRegistry(r);
            setLoading(false);
        });
    }, []);

    return { registry, loading };
}
